const Group = require('../models/Group');
const wantsJson = require('../utils/wantsJson');

/*
  All the middleware that decides who is allowed to do what.

  When someone logs in I only keep their id in the session, nothing else.
  attachUser then loads the full user on every request and puts it on
  res.locals.currentUser, which means every EJS page can check it and show
  something different to a guest than to a logged in member.
*/

// runs on every single request. loads the logged in user if there is one.
// it never blocks anything, it just makes the user available further down.
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
      // the session points at a user that no longer exists, so throw the session away
      req.session.destroy(() => {});
    }
  } catch (err) {
    return next(err);
  }
  next();
}

// stops anyone who is not logged in.
// an ajax call gets back 401 and json, a normal page visit gets sent to /login.
function requireLogin(req, res, next) {
  if (req.currentUser) return next();

  if (wantsJson(req)) {
    return res.status(401).json({ error: 'You must be logged in to do that.' });
  }
  return res.redirect('/login');
}

// only lets site admins through
function requireAdmin(req, res, next) {
  if (req.currentUser && req.currentUser.role === 'admin') return next();

  if (wantsJson(req)) {
    return res.status(403).json({ error: 'Administrator access required.' });
  }
  return res.status(403).render('pages/error', {
    title: 'Forbidden',
    message: 'Administrator access required.',
  });
}

// only lets the admin of that group through. site admins can always pass.
// this is what protects all the group management actions.
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

    req.group = group; // hand the group to the controller so it does not have to look it up again
    next();
  } catch (err) {
    next(err);
  }
}

// if you are already logged in there is no reason to see login or register
function requireGuest(req, res, next) {
  if (req.currentUser) return res.redirect('/feed');
  next();
}

module.exports = { attachUser, requireLogin, requireAdmin, requireGroupAdmin, requireGuest };
