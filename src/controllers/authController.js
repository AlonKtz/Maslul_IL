const User = require('../models/User');

/**
 * Authentication controller — register, login, logout.
 * All three answer JSON because the forms submit through jQuery Ajax;
 * the client redirects on success.
 */

// GET /register — show the registration page
function showRegister(req, res) {
  res.render('pages/register', { title: 'Create account' });
}

// GET /login — show the login page
function showLogin(req, res) {
  res.render('pages/login', { title: 'Sign in' });
}

// POST /auth/register — create a new account and log the user in
async function register(req, res, next) {
  try {
    const { username, password, displayName, location, bio } = req.body;

    const exists = await User.findOne({ username: String(username).toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }

    const user = await User.create({
      username,
      password, // hashed by the pre-save hook in the model
      displayName: displayName || username,
      location: location || '',
      bio: bio || '',
    });

    // Log the new user straight in.
    req.session.userId = user._id;
    return res.status(201).json({ ok: true, redirect: '/events' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login — verify credentials and start a session
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    // password is select:false in the schema, so ask for it explicitly.
    const user = await User.findOne({ username: String(username).toLowerCase() }).select('+password');

    // Same message for "no such user" and "wrong password" so we don't
    // reveal which usernames exist.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    req.session.userId = user._id;
    return res.json({ ok: true, redirect: '/events' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout — end the session
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true, redirect: '/' });
  });
}

module.exports = { showRegister, showLogin, register, login, logout };
