const express = require('express');
const { body } = require('express-validator');
const posts = require('../controllers/postController');
const { requireLogin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const postRules = [
  body('text').trim().notEmpty().withMessage('Write something first')
    .isLength({ max: 1000 }).withMessage('Post is too long (1000 characters max)'),
];

const commentRules = [
  body('text').trim().notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 500 }).withMessage('Comment is too long'),
];

router.use(requireLogin);

// Page
router.get('/feed', posts.showFeed);

// API — /search before /:id
router.get('/api/posts/search', posts.search);
router.get('/api/posts', posts.list);
router.post('/api/posts', postRules, handleValidation, posts.create);
router.put('/api/posts/:id', validateObjectId(), postRules, handleValidation, posts.update);
router.delete('/api/posts/:id', validateObjectId(), posts.remove);

// Likes and comments
router.post('/api/posts/:id/like', validateObjectId(), posts.toggleLike);
router.post('/api/posts/:id/comments', validateObjectId(), commentRules, handleValidation, posts.addComment);
router.delete('/api/posts/:id/comments/:commentId', validateObjectId(), posts.removeComment);

module.exports = router;
