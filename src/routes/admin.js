const express = require('express');
const { body } = require('express-validator');
const admin = require('../controllers/adminController');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { handleValidation, validateObjectId } = require('../middleware/validate');

const router = express.Router();

// Every route in this file is for site administrators only.
router.use(requireLogin, requireAdmin);

router.get('/admin', admin.showAdmin);

router.get('/api/admin/overview', admin.overview);
router.get('/api/admin/members', admin.members);
router.get('/api/admin/content', admin.content);

router.post(
  '/api/admin/members/:id/role',
  validateObjectId(),
  [body('role').isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"')],
  handleValidation,
  admin.setRole
);

module.exports = router;
