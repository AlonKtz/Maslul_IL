const Group = require('../models/Group');
const Event = require('../models/Event');
const { contains, paginate, num } = require('../utils/query');

/**
 * Group controller — car communities.
 * Full Create / Update / Delete / List / Search, plus membership management.
 *
 * Management rule: only the group's manager (`admin`) — or a site
 * administrator — may edit the group, remove members or approve join
 * requests. This is the "extended abilities" requirement.
 */

// GET /groups — browse page
function showGroups(req, res) {
  res.render('pages/groups', { title: 'Groups', categories: Group.CATEGORIES });
}

// GET /groups/:id — single group page
async function showGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'username displayName avatar')
      .populate('members', 'username displayName avatar')
      .populate('pendingRequests', 'username displayName avatar');

    if (!group) {
      return res.status(404).render('pages/error', {
        title: 'Group not found',
        message: 'That group does not exist.',
      });
    }

    const me = req.currentUser;
    const isMember = group.members.some((m) => m._id.equals(me._id));
    const isManager = group.admin._id.equals(me._id);

    // Private groups are closed to non-members.
    if (group.isPrivate && !isMember && !isManager && me.role !== 'admin') {
      return res.status(403).render('pages/error', {
        title: 'Private group',
        message: 'This group is private. Ask the manager to approve your request to join.',
      });
    }

    res.render('pages/group', {
      title: group.name,
      group,
      isMember,
      isManager: isManager || me.role === 'admin',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIST
// GET /api/groups            -> all groups
// GET /api/groups?mine=true  -> groups the member belongs to or manages
async function list(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.query.mine === 'true') {
      filter.$or = [{ members: req.currentUser._id }, { admin: req.currentUser._id }];
    }

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('admin', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Group.countDocuments(filter),
    ]);

    res.json({ groups, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- SEARCH
// GET /api/groups/search
// Parameters: name, category, brand, privacy, minMembers.
async function search(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { name, category, brand, privacy, minMembers } = req.query;
    const filter = {};

    if (name && name.trim()) filter.name = contains(name);
    if (brand && brand.trim()) filter.brand = contains(brand);
    if (category && Group.CATEGORIES.includes(category)) filter.category = category;
    if (privacy === 'public') filter.isPrivate = false;
    if (privacy === 'private') filter.isPrivate = true;

    const min = num(minMembers);
    if (min !== null && min > 0) filter[`members.${min - 1}`] = { $exists: true };

    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate('admin', 'username displayName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Group.countDocuments(filter),
    ]);

    res.json({ groups, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- CREATE
// POST /api/groups — the creator automatically becomes manager and member.
async function create(req, res, next) {
  try {
    const { name, description, category, brand, isPrivate, coverImage } = req.body;

    const group = await Group.create({
      name,
      description,
      category,
      brand,
      isPrivate: Boolean(isPrivate),
      coverImage: coverImage || undefined,
      admin: req.currentUser._id,
      members: [req.currentUser._id],
    });

    await group.populate('admin', 'username displayName avatar');
    res.status(201).json({ ok: true, group });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- UPDATE
// PUT /api/groups/:id — requireGroupAdmin already loaded req.group.
async function update(req, res, next) {
  try {
    const group = req.group;

    const allowed = ['name', 'description', 'category', 'brand', 'isPrivate', 'coverImage'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) group[field] = req.body[field];
    });

    await group.save();
    await group.populate('admin', 'username displayName avatar');
    res.json({ ok: true, group });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- DELETE
// DELETE /api/groups/:id — also removes the group's posts.
async function remove(req, res, next) {
  try {
    // Events hosted by this group lose their home, so remove them too.
    await Event.deleteMany({ group: req.group._id });
    await req.group.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- MEMBERSHIP
// POST /api/groups/:id/join
// Public groups join immediately; private groups queue a request for the manager.
async function join(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found.' });

    const meId = req.currentUser._id;

    if (group.members.some((m) => m.equals(meId))) {
      return res.status(409).json({ error: 'You are already a member.' });
    }

    if (group.isPrivate) {
      if (group.pendingRequests.some((m) => m.equals(meId))) {
        return res.status(409).json({ error: 'Your request is already waiting for approval.' });
      }
      group.pendingRequests.push(meId);
      await group.save();
      return res.json({ ok: true, pending: true, message: 'Request sent to the group manager.' });
    }

    group.members.push(meId);
    await group.save();
    res.json({ ok: true, joined: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/groups/:id/leave
async function leave(req, res, next) {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found.' });

    if (group.admin.equals(req.currentUser._id)) {
      return res.status(400).json({ error: 'The manager cannot leave their own group.' });
    }

    group.members = group.members.filter((m) => !m.equals(req.currentUser._id));
    await group.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/groups/:id/approve  { userId }  — manager only
async function approve(req, res, next) {
  try {
    const group = req.group;
    const { userId } = req.body;

    if (!group.pendingRequests.some((m) => m.equals(userId))) {
      return res.status(404).json({ error: 'No pending request from that member.' });
    }

    group.pendingRequests = group.pendingRequests.filter((m) => !m.equals(userId));
    if (!group.members.some((m) => m.equals(userId))) group.members.push(userId);

    await group.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/groups/:id/reject  { userId }  — manager only
async function reject(req, res, next) {
  try {
    const group = req.group;
    group.pendingRequests = group.pendingRequests.filter((m) => !m.equals(req.body.userId));
    await group.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/groups/:id/remove-member  { userId }  — manager only
async function removeMember(req, res, next) {
  try {
    const group = req.group;
    const { userId } = req.body;

    if (group.admin.equals(userId)) {
      return res.status(400).json({ error: 'The manager cannot be removed.' });
    }

    group.members = group.members.filter((m) => !m.equals(userId));
    await group.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showGroups,
  showGroup,
  list,
  search,
  create,
  update,
  remove,
  join,
  leave,
  approve,
  reject,
  removeMember,
};
