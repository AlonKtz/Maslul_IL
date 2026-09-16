const express = require('express');
const { requireLogin } = require('../middleware/auth');
const { CITIES } = require('../data/cities');
const { latestRecap } = require('../utils/recap');

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

// GET /motorsport. racing from around the world, plus the recap videos.
// the youtube video is the newest upload on the GT World channel, see
// utils/recap.js for how it is found and how often it is checked
router.get('/motorsport', requireLogin, async (req, res, next) => {
  try {
    const recap = await latestRecap();
    res.render('pages/motorsport', {
      title: 'Motorsport',
      youtubeId: recap.id,
      youtubeTitle: recap.title,
    });
  } catch (err) {
    next(err);
  }
});

// /feed, /chat, /stats and /admin live in their own route files because those
// pages need data from a controller. I had them here too at one point and it
// broke the chat page, because whichever router express loads first wins and
// mine was the empty one. worth remembering.

module.exports = router;
