const express = require('express');
const { body } = require('express-validator');
const messages = require('../controllers/messageController');
const { requireLogin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const textRule = [
  body('text').trim().notEmpty().withMessage('Message cannot be empty')
    .isLength({ max: 1000 }).withMessage('Message is too long'),
];

router.use(requireLogin);

// Page
router.get('/chat', messages.showChat);

// the fixed paths have to come before /:userId or they get read as an id
router.get('/api/messages/conversations', messages.conversations);
router.get('/api/messages/search', messages.search);
router.get('/api/messages/:userId', validateObjectId('userId'), messages.history);

// new messages are created over the socket, not here. editing and deleting
// are normal http requests though.
router.put('/api/messages/:id', validateObjectId(), textRule, handleValidation, messages.update);
router.delete('/api/messages/:id', validateObjectId(), messages.remove);

module.exports = router;
