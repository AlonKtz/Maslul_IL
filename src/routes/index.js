const express = require('express');
const { requireLogin } = require('../middleware/auth');
const { CITIES } = require('../data/cities');

const router = express.Router();

// GET / — landing page for guests, meets & races for members.
router.get('/', (req, res) => {
  if (req.currentUser) return res.redirect('/feed');
  res.render('pages/landing', { title: 'Home' });
});

// The search, chat, stats and admin pages are shells: their content is
// loaded over Ajax by the scripts in /public/js.
router.get('/search', requireLogin, (req, res) => {
  res.render('pages/search', { title: 'Search', cities: CITIES });
});

// /feed, /chat, /stats and /admin are served by their own routers, because
// those pages need data from their controllers. They must not be declared
// here as well, or whichever router is registered first would win.

module.exports = router;
