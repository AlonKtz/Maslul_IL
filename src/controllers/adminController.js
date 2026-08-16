const User = require('../models/User');
const Group = require('../models/Group');
const Event = require('../models/Event');
const Listing = require('../models/Listing');
const Car = require('../models/Car');
const Message = require('../models/Message');
const { contains, paginate } = require('../utils/query');

/**
 * Administration controller.
 *
 * Everything here is behind requireAdmin, so only a site administrator can
 * reach it — a regular member gets 403 even if they type the address in.
 * The administrator's extra powers are the moderation ones: seeing every
 * member and removing content that should not be on the site.
 */

// GET /admin — page shell.
function showAdmin(req, res) {
  res.render('pages/admin', { title: 'Administration' });
}

// GET /api/admin/overview — counts plus the newest members and content.
async function overview(req, res, next) {
  try {
    const [members, groups, events, listings, cars, messages, recentMembers] = await Promise.all([
      User.countDocuments(),
      Group.countDocuments(),
      Event.countDocuments(),
      Listing.countDocuments(),
      Car.countDocuments(),
      Message.countDocuments(),
      User.find().select('username displayName avatar location role createdAt')
        .sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      counts: { members, groups, events, listings, cars, messages },
      recentMembers,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/members — search every member, including their role.
async function members(req, res, next) {
  try {
    const { page, limit, skip } = paginate(req.query);
    const { username, location, role } = req.query;
    const filter = {};

    if (username && username.trim()) {
      filter.$or = [{ username: contains(username) }, { displayName: contains(username) }];
    }
    if (location && location.trim()) filter.location = contains(location);
    if (role === 'admin' || role === 'user') filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username displayName avatar location role friends createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/members/:id/role — promote or demote a member.
async function setRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin".' });
    }

    // An administrator must not be able to lock themselves out.
    if (String(req.params.id) === String(req.currentUser._id) && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot remove your own administrator rights.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Member not found.' });

    user.role = role;
    await user.save();

    res.json({ ok: true, role: user.role });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reported — the newest content, so it can be moderated.
async function content(req, res, next) {
  try {
    const [events, listings] = await Promise.all([
      Event.find().populate('host', 'username displayName')
        .sort({ createdAt: -1 }).limit(15),
      Listing.find().populate('seller', 'username displayName')
        .sort({ createdAt: -1 }).limit(15),
    ]);

    res.json({ events, listings });
  } catch (err) {
    next(err);
  }
}

module.exports = { showAdmin, overview, members, setRole, content };
