const express = require('express');
const { requireLogin } = require('../middleware/auth');
const { CITIES } = require('../data/cities');

const router = express.Router();

// GET /. guests get the landing page, members get sent to their feed
router.get('/', (req, res) => {
  if (req.currentUser) return res.redirect('/feed');
  res.render('pages/landing', { title: 'Home' });
});

// the search page is just an empty shell. the content gets loaded over ajax
// by the matching script in /public/js.
router.get('/search', requireLogin, (req, res) => {
  res.render('pages/search', { title: 'Search', cities: CITIES });
});

// /feed, /chat, /stats and /admin live in their own route files because those
// pages need data from a controller. I had them here too at one point and it
// broke the chat page, because whichever router express loads first wins and
// mine was the empty one. worth remembering.

module.exports = router;
