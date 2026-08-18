const express = require('express');
const { body } = require('express-validator');
const auth = require('../controllers/authController');
const { handleValidation } = require('../middleware/validate');
const { requireGuest, requireLogin } = require('../middleware/auth');

const router = express.Router();

// the checks the sign up form has to pass on the server
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers and underscore'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be at least 6 characters'),
  body('displayName').optional().trim().isLength({ max: 40 }).withMessage('Display name is too long'),
  body('location').optional().trim().isLength({ max: 60 }).withMessage('Location is too long'),
  body('bio').optional().trim().isLength({ max: 300 }).withMessage('Bio is too long'),
];

const loginRules = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Pages
router.get('/register', requireGuest, auth.showRegister);
router.get('/login', requireGuest, auth.showLogin);

// the actual actions. the forms call these with ajax
router.post('/auth/register', requireGuest, registerRules, handleValidation, auth.register);
router.post('/auth/login', requireGuest, loginRules, handleValidation, auth.login);
router.post('/auth/logout', requireLogin, auth.logout);

module.exports = router;
