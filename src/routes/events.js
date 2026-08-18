const express = require('express');
const { body } = require('express-validator');
const events = require('../controllers/eventController');
const Event = require('../models/Event');
const { CITY_NAMES } = require('../data/cities');
const { requireLogin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const eventRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 80 }).withMessage('Title must be 3-80 characters'),
  body('description').optional({ values: 'falsy' })
    .isLength({ max: 1000 }).withMessage('Description is too long'),
  body('type').isIn(Event.EVENT_TYPES).withMessage('Choose meet or race'),
  body('raceType').optional({ values: 'falsy' })
    .isIn(Event.RACE_TYPES).withMessage('Unknown race type'),
  body('city').isIn(CITY_NAMES).withMessage('Pick a city from the list'),
  body('address').optional({ values: 'falsy' })
    .isLength({ max: 120 }).withMessage('Address is too long'),
  body('startsAt').isISO8601().withMessage('Pick a valid date and time'),
  body('maxAttendees').optional({ values: 'falsy' })
    .isInt({ min: 0, max: 10000 }).withMessage('Attendee limit must be a sensible number'),
];

const commentRules = [
  body('text').trim().notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 500 }).withMessage('Comment is too long'),
];

router.use(requireLogin);

// Pages
router.get('/events', events.showEvents);
router.get('/events/:id', validateObjectId(), events.showEvent);

// again /search and /area go before /:id or express treats them as ids
router.get('/api/events/search', events.search);
router.post('/api/events/area', events.searchArea);
router.get('/api/events', events.list);
router.post('/api/events', eventRules, handleValidation, events.create);
router.put('/api/events/:id', validateObjectId(), eventRules, handleValidation, events.update);
router.delete('/api/events/:id', validateObjectId(), events.remove);

// RSVP, likes and comments
router.post('/api/events/:id/attend', validateObjectId(), events.toggleAttend);
router.post('/api/events/:id/like', validateObjectId(), events.toggleLike);
router.post('/api/events/:id/comments', validateObjectId(), commentRules, handleValidation, events.addComment);
router.delete('/api/events/:id/comments/:commentId', validateObjectId(), events.removeComment);

module.exports = router;
