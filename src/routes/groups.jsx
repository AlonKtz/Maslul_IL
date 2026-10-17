const express = require('express');
const { body } = require('express-validator');
const groups = require('../controllers/groupController');
const Group = require('../models/Group');
const { requireLogin, requireGroupAdmin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

const groupRules = [
  body('name').trim().notEmpty().withMessage('Group name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Group name must be 2-50 characters'),
  body('description').optional({ values: 'falsy' })
    .isLength({ max: 500 }).withMessage('Description is too long'),
  body('category').optional({ values: 'falsy' })
    .isIn(Group.CATEGORIES).withMessage('Unknown category'),
  body('brand').optional({ values: 'falsy' })
    .isLength({ max: 40 }).withMessage('Brand is too long'),
];

// every manager action says which member it is about, so check that id
const memberRule = [body('userId').isMongoId().withMessage('Invalid member id')];

router.use(requireLogin);

// Pages
router.get('/groups', groups.showGroups);
router.get('/groups/:id', validateObjectId(), groups.showGroup);

// /search before /:id, same reason as the other route files
router.get('/api/groups/search', groups.search);
router.get('/api/groups', groups.list);
router.post('/api/groups', groupRules, handleValidation, groups.create);

// only the manager can edit or delete the group. requireGroupAdmin does that check
router.put('/api/groups/:id', validateObjectId(), requireGroupAdmin, groupRules, handleValidation, groups.update);
router.delete('/api/groups/:id', validateObjectId(), requireGroupAdmin, groups.remove);

// joining and leaving is open to any logged in member
router.post('/api/groups/:id/join', validateObjectId(), groups.join);
router.post('/api/groups/:id/leave', validateObjectId(), groups.leave);

// these three are manager only. this is the part of the brief that wants a
// manager to have more abilities than a normal member.
router.post('/api/groups/:id/approve', validateObjectId(), requireGroupAdmin, memberRule, handleValidation, groups.approve);
router.post('/api/groups/:id/reject', validateObjectId(), requireGroupAdmin, memberRule, handleValidation, groups.reject);
router.post('/api/groups/:id/remove-member', validateObjectId(), requireGroupAdmin, memberRule, handleValidation, groups.removeMember);

module.exports = router;
