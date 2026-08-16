const Group = require('../models/Group');

/**
 * Access-control middleware.
 *
 * The logged-in user's id is kept in the session (req.session.userId).
 * `res.locals.currentUser` is filled by attachUser so every EJS view can
 * render differently for guests vs logged-in users.
 */

// Loads the current user (if any) onto req/res for downstream use.
// Runs on every request; never blocks.
async function attachUser(req, res, next) {
  res.locals.currentUser = null;
  req.currentUser = null;

  if (!req.session || !req.session.userId) return next();

  try {
    const User = require('../models/User');
    const user = await User.findById(req.session.userId);
    if (user) {
      req.currentUser = user;
      res.locals.currentUser = user;
    } else {
      // Session points at a deleted user — clear it.
      req.session.destroy(() => {});
    }
  } catch (err) {
    return next(err);
  }
  next();
}

// Blocks anyone who is not logged in.
// Ajax requests get 401 JSON; normal page requests get redirected to login.
function requireLogin(req, res, next) {
  if (req.currentUser) return next();

  if (req.xhr || req.accepts('json') === 'json' || req.path.startsWith('/api')) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }
  return res.redirect('/login');
}

// Blocks anyone who is not a site administrator.
function requireAdmin(req, res, next) {
  if (req.currentUser && req.currentUser.role === 'admin') return next();

  if (req.xhr || req.path.startsWith('/api')) {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return res.status(403).render('pages/error', {
    title: 'Forbidden',
    message: 'Administrator access required.',
  });
}

// Blocks anyone who is not the admin of :id group (site admins always pass).
// Used to gate group-management pages and actions.
async function requireGroupAdmin(req, res, next) {
  try {
    const group = await Group.findById(req.params.id || req.params.groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const isOwner = group.admin.equals(req.currentUser._id);
    const isSiteAdmin = req.currentUser.role === 'admin';

    if (!isOwner && !isSiteAdmin) {
      return res.status(403).json({ error: 'Only the group manager can do that.' });
    }

    req.group = group; // pass it along so the controller need not re-query
    next();
  } catch (err) {
    next(err);
  }
}

// Redirects already-logged-in users away from login/register pages.
function requireGuest(req, res, next) {
  if (req.currentUser) return res.redirect('/feed');
  next();
}

module.exports = { attachUser, requireLogin, requireAdmin, requireGroupAdmin, requireGuest };
