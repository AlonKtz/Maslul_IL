const express = require('express');
const { body } = require('express-validator');
const cars = require('../controllers/carController');
const Car = require('../models/Car');
const { requireLogin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

// the validation rules for adding or editing a car. I keep them in one place
// because create and update both need exactly the same checks.
const carRules = [
  body('make').trim().notEmpty().withMessage('Make is required')
    .isLength({ max: 40 }).withMessage('Make is too long'),
  body('model').trim().notEmpty().withMessage('Model is required')
    .isLength({ max: 40 }).withMessage('Model is too long'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be a real year'),
  body('horsepower').optional({ values: 'falsy' })
    .isInt({ min: 0, max: 2000 }).withMessage('Horsepower must be between 0 and 2000'),
  body('category').optional({ values: 'falsy' })
    .isIn(Car.CATEGORIES).withMessage('Unknown body type'),
  body('color').optional({ values: 'falsy' })
    .isLength({ max: 30 }).withMessage('Color is too long'),
  body('engine').optional({ values: 'falsy' })
    .isLength({ max: 40 }).withMessage('Engine text is too long'),
  body('description').optional({ values: 'falsy' })
    .isLength({ max: 500 }).withMessage('Description is too long'),
];

// nothing in this file works unless you are logged in
router.use(requireLogin);

// Page
router.get('/garage', cars.showGarage);

// the order matters here. /search has to come before /:id, otherwise express
// reads the word "search" as an id and the route never runs.
router.get('/api/cars/search', cars.search);
router.get('/api/cars', cars.list);
router.get('/api/cars/:id', validateObjectId(), cars.getOne);
router.post('/api/cars', carRules, handleValidation, cars.create);
router.put('/api/cars/:id', validateObjectId(), carRules, handleValidation, cars.update);
router.delete('/api/cars/:id', validateObjectId(), cars.remove);

module.exports = router;
