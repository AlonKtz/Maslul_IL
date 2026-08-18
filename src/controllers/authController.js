const User = require('../models/User');

/*
  Register, login and logout.

  All three send back json rather than rendering a page, because the forms are
  submitted with jQuery ajax. The browser does the redirect itself once it
  gets an ok back.
*/

// GET /register, shows the sign up page
function showRegister(req, res) {
  res.render('pages/register', { title: 'Create account' });
}

// GET /login, shows the sign in page
function showLogin(req, res) {
  res.render('pages/login', { title: 'Sign in' });
}

// POST /auth/register, makes the account and logs them straight in
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

    // no reason to make them log in again right after signing up
    req.session.userId = user._id;
    return res.status(201).json({ ok: true, redirect: '/feed' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/login, checks the password and starts the session
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    // the schema hides the password by default so I have to ask for it here
    const user = await User.findOne({ username: String(username).toLowerCase() }).select('+password');

    // I give the same message whether the user does not exist or the password
    // is wrong. otherwise someone could use the login form to find out which
    // usernames are real.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    req.session.userId = user._id;
    return res.json({ ok: true, redirect: '/feed' });
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout, kills the session
function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true, redirect: '/' });
  });
}

module.exports = { showRegister, showLogin, register, login, logout };
