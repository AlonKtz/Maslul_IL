const express = require('express');
const { body } = require('express-validator');
const users = require('../controllers/userController');
const { requireLogin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const profileRules = [
  body('displayName').optional({ values: 'falsy' })
    .isLength({ max: 40 }).withMessage('Display name is too long'),
  body('bio').optional({ values: 'falsy' })
    .isLength({ max: 300 }).withMessage('Bio is too long'),
  body('location').optional({ values: 'falsy' })
    .isLength({ max: 60 }).withMessage('Location is too long'),
  body('newPassword').optional({ values: 'falsy' })
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

router.use(requireLogin);

// Page
router.get('/profile/:username', users.showProfile);

// API — /search before /:id
router.get('/api/users/search', users.search);
router.get('/api/users', users.list);
router.get('/api/users/:id', validateObjectId(), users.getOne);
router.put('/api/users/:id', validateObjectId(), profileRules, handleValidation, users.update);
router.delete('/api/users/:id', validateObjectId(), users.remove);

// Friends
router.post('/api/users/:id/friend-request', validateObjectId(), users.sendFriendRequest);
router.post('/api/users/:id/accept', validateObjectId(), users.acceptFriendRequest);
router.post('/api/users/:id/unfriend', validateObjectId(), users.unfriend);

module.exports = router;
