const express = require('express');
const { requireLogin } = require('../middleware/auth');
const { CITIES } = require('../data/cities');
const Group = require('../models/Group');
const { latestRecaps } = require('../utils/recap');

const router = express.Router();

// GET /. guests get the landing page, members get sent to their feed
router.get('/', (req, res) => {
  if (req.currentUser) return res.redirect('/feed');
  res.render('pages/landing', { title: 'Home' });
});

// the search page is just an empty shell. the content is React
// (client/components/search/), loaded from the api routes.
router.get('/search', requireLogin, (req, res) => {
  res.render('pages/search', { title: 'Search', cities: CITIES, categories: Group.CATEGORIES });
});

// GET /motorsport. racing from around the world, plus the recap videos.
// the videos are the newest uploads from GT World, Formula 1 and NASCAR, see
// utils/recap.js for how they are found and how often they are checked
router.get('/motorsport', requireLogin, async (req, res, next) => {
  try {
    res.render('pages/motorsport', {
      title: 'Motorsport',
      videos: await latestRecaps(),
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
