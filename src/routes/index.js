const express = require('express');
const router = express.Router();

// GET / — landing page for guests, feed for members.
router.get('/', (req, res) => {
  if (req.currentUser) return res.redirect('/feed');
  res.render('pages/landing', { title: 'Home' });
});

module.exports = router;
