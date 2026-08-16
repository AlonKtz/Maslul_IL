const express = require('express');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { CITIES } = require('../data/cities');

const router = express.Router();

// GET / — landing page for guests, meets & races for members.
router.get('/', (req, res) => {
  if (req.currentUser) return res.redirect('/events');
  res.render('pages/landing', { title: 'Home' });
});

// The search, chat, stats and admin pages are shells: their content is
// loaded over Ajax by the scripts in /public/js.
router.get('/search', requireLogin, (req, res) => {
  res.render('pages/search', { title: 'Search', cities: CITIES });
});

// /chat is served by src/routes/messages.js and /stats by src/routes/stats.js,
// because those pages need data from their controllers. They must not be
// declared here as well, or whichever router is registered first would win.
router.get('/admin', requireLogin, requireAdmin, (req, res) => {
  res.render('pages/admin', { title: 'Administration' });
});

module.exports = router;
