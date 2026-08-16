const User = require('../models/User');
const Car = require('../models/Car');
const Event = require('../models/Event');
const Listing = require('../models/Listing');
const Group = require('../models/Group');
const { contains, paginate } = require('../utils/query');

/**
 * User controller — member profiles and the friend graph.
 * Full Create / Update / Delete / List / Search.
 * (Create lives in authController as registration, which is the same thing
 * from the user's point of view.)
 *
 * Privacy rule: a member may only edit or delete their own account.
 */

// GET /profile/:username — a member's profile page
async function showProfile(req, res, next) {
  try {
    const user = await User.findOne({ username: String(req.params.username).toLowerCase() })
      .populate('friends', 'username displayName avatar');

    if (!user) {
      return res.status(404).render('pages/error', {
        title: 'Member not found',
        message: 'No member with that username.',
      });
    }

    const [cars, eventCount, listingCount, groups] = await Promise.all([
      Car.find({ owner: user._id }).sort({ createdAt: -1 }),
      Event.countDocuments({ host: user._id }),
      Listing.countDocuments({ seller: user._id }),
      Group.find({ members: user._id }).select('name category'),
    ]);

    const isSelf = user._id.equals(req.currentUser._id);
    const isFriend = user.friends.some((f) => f._id.equals(req.currentUser._id));
    const requestSent = user.friendRequests.some((f) => f.equals(req.currentUser._id));

    res.render('pages/profile', {
      title: user.displayName || user.username,
      user,
      cars,
      eventCount,
      listingCount,
      groups,
      isSelf,
      isFriend,
      requestSent,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- LIST
// GET /api/users
async function list(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);

    const [users, total] = await Promise.all([
      User.find()
        .select('username displayName avatar location bio friends createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- SEARCH
// GET /api/users/search
// Parameters: username, location, bio (keyword), hasCarMake.
async function search(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { username, location, keyword, carMake } = req.query;
    const filter = {};

    if (username && username.trim()) {
      filter.$or = [{ username: contains(username) }, { displayName: contains(username) }];
    }
    if (location && location.trim()) filter.location = contains(location);
    if (keyword && keyword.trim()) filter.bio = contains(keyword);

    // Members who own a car of a given make — joins through the Car model.
    if (carMake && carMake.trim()) {
      const owners = await Car.find({ make: contains(carMake) }).distinct('owner');
      filter._id = { $in: owners };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username displayName avatar location bio friends createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) || 1, filter: req.query });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- READ ONE
// GET /api/users/:id
async function getOne(req, res, next) {
  try {
    const user = await User.findById(req.params.id)
      .select('username displayName avatar location bio friends createdAt');
    if (!user) return res.status(404).json({ error: 'Member not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- UPDATE
// PUT /api/users/:id — a member may only update their own profile.
async function update(req, res, next) {
  try {
    if (req.params.id !== String(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own profile.' });
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ error: 'Member not found.' });

    ['displayName', 'bio', 'location', 'avatar'].forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // Changing the password requires the current one (unless a site admin).
    if (req.body.newPassword) {
      if (req.currentUser.role !== 'admin') {
        const ok = await user.comparePassword(req.body.currentPassword || '');
        if (!ok) return res.status(401).json({ error: 'Your current password is incorrect.' });
      }
      user.password = req.body.newPassword; // re-hashed by the pre-save hook
    }

    await user.save();
    res.json({
      ok: true,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        location: user.location,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- DELETE
// DELETE /api/users/:id — removes the member and everything they own.
async function remove(req, res, next) {
  try {
    if (req.params.id !== String(req.currentUser._id) && req.currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own account.' });
    }

    const id = req.params.id;

    // Clean up the data that belongs to this member.
    await Promise.all([
      Car.deleteMany({ owner: id }),
      Event.deleteMany({ host: id }),
      Listing.deleteMany({ seller: id }),
      User.updateMany({ friends: id }, { $pull: { friends: id } }),
      Group.updateMany({ members: id }, { $pull: { members: id } }),
    ]);

    // Groups they managed are removed along with the events those groups host.
    const managed = await Group.find({ admin: id }).select('_id');
    if (managed.length) {
      const ids = managed.map((g) => g._id);
      await Event.deleteMany({ group: { $in: ids } });
      await Group.deleteMany({ _id: { $in: ids } });
    }

    await User.findByIdAndDelete(id);

    // If members delete themselves, end their session too.
    if (String(req.currentUser._id) === id) {
      return req.session.destroy(() => res.json({ ok: true, redirect: '/' }));
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------- FRIENDS
// POST /api/users/:id/friend-request
async function sendFriendRequest(req, res, next) {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: 'Member not found.' });

    const meId = req.currentUser._id;
    if (target._id.equals(meId)) {
      return res.status(400).json({ error: 'You cannot add yourself.' });
    }
    if (target.friends.some((f) => f.equals(meId))) {
      return res.status(409).json({ error: 'You are already friends.' });
    }
    if (target.friendRequests.some((f) => f.equals(meId))) {
      return res.status(409).json({ error: 'Request already sent.' });
    }

    target.friendRequests.push(meId);
    await target.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/:id/accept — accept the request sent by :id
async function acceptFriendRequest(req, res, next) {
  try {
    const me = await User.findById(req.currentUser._id);
    const other = await User.findById(req.params.id);
    if (!other) return res.status(404).json({ error: 'Member not found.' });

    if (!me.friendRequests.some((f) => f.equals(other._id))) {
      return res.status(404).json({ error: 'No pending request from that member.' });
    }

    me.friendRequests = me.friendRequests.filter((f) => !f.equals(other._id));
    if (!me.friends.some((f) => f.equals(other._id))) me.friends.push(other._id);
    if (!other.friends.some((f) => f.equals(me._id))) other.friends.push(me._id);

    await Promise.all([me.save(), other.save()]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/users/:id/unfriend
async function unfriend(req, res, next) {
  try {
    const me = await User.findById(req.currentUser._id);
    const other = await User.findById(req.params.id);
    if (!other) return res.status(404).json({ error: 'Member not found.' });

    me.friends = me.friends.filter((f) => !f.equals(other._id));
    other.friends = other.friends.filter((f) => !f.equals(me._id));

    await Promise.all([me.save(), other.save()]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  showProfile,
  list,
  search,
  getOne,
  update,
  remove,
  sendFriendRequest,
  acceptFriendRequest,
  unfriend,
};
