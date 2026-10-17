const express = require('express');
const feed = require('../controllers/feedController');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.use(requireLogin);

router.get('/feed', feed.showFeed);
router.get('/api/feed', feed.feed);
router.get('/api/feed/suggestions', feed.suggestions);

module.exports = router;
