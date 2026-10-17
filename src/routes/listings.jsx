const express = require('express');
const { body } = require('express-validator');
const listings = require('../controllers/listingController');
const Listing = require('../models/Listing');
const { CITY_NAMES } = require('../data/cities');
const { requireLogin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const listingRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 80 }).withMessage('Title must be 3-80 characters'),
  body('description').optional({ values: 'falsy' })
    .isLength({ max: 1000 }).withMessage('Description is too long'),
  body('price').isFloat({ min: 0, max: 10000000 }).withMessage('Price must be a real amount'),
  body('category').isIn(Listing.CATEGORIES).withMessage('Pick a category'),
  body('condition').optional({ values: 'falsy' })
    .isIn(Listing.CONDITIONS).withMessage('Unknown condition'),
  body('city').isIn(CITY_NAMES).withMessage('Pick a city from the list'),
  body('year').optional({ values: 'falsy' })
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Year must be a real year'),
  body('make').optional({ values: 'falsy' })
    .isLength({ max: 40 }).withMessage('Make is too long'),
  body('model').optional({ values: 'falsy' })
    .isLength({ max: 40 }).withMessage('Model is too long'),
];

const commentRules = [
  body('text').trim().notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 500 }).withMessage('Comment is too long'),
];

router.use(requireLogin);

// Pages
router.get('/market', listings.showMarket);
router.get('/market/:id', validateObjectId(), listings.showListing);

// /search and /area before /:id, same as the other files
router.get('/api/listings/search', listings.search);
router.post('/api/listings/area', listings.searchArea);
router.get('/api/listings', listings.list);
router.post('/api/listings', listingRules, handleValidation, listings.create);
router.put('/api/listings/:id', validateObjectId(), listingRules, handleValidation, listings.update);
router.delete('/api/listings/:id', validateObjectId(), listings.remove);

// Sold flag, likes and comments
router.post('/api/listings/:id/sold', validateObjectId(), listings.toggleSold);
router.post('/api/listings/:id/like', validateObjectId(), listings.toggleLike);
router.post('/api/listings/:id/comments', validateObjectId(), commentRules, handleValidation, listings.addComment);
router.delete('/api/listings/:id/comments/:commentId', validateObjectId(), listings.removeComment);

module.exports = router;
