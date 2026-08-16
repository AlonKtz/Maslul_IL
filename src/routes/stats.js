const express = require('express');
const stats = require('../controllers/statsController');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

router.use(requireLogin);

// Page
router.get('/stats', stats.showStats);

// Data endpoints — each one runs an aggregation over the live collections.
router.get('/api/stats/summary', stats.summary);
router.get('/api/stats/events-per-month', stats.eventsPerMonth);
router.get('/api/stats/cars-by-make', stats.carsByMake);
router.get('/api/stats/listings-by-category', stats.listingsByCategory);
router.get('/api/stats/events-by-city', stats.eventsByCity);
router.get('/api/stats/group-activity', stats.groupActivity);

module.exports = router;
