const express = require('express');
const upload = require('../middleware/upload');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

/**
 * Image upload endpoints. The client uploads first, gets back a URL, and
 * then sends that URL as part of the event/listing/car it is saving.
 */

router.use(requireLogin);

// POST /api/upload — a single image (car photo, avatar, event cover)
router.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image was uploaded.' });
  res.status(201).json({ ok: true, url: '/uploads/' + req.file.filename });
});

// POST /api/upload/many — several images at once (listing photos)
router.post('/api/upload/many', upload.array('images', 6), (req, res) => {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'No images were uploaded.' });
  }
  res.status(201).json({ ok: true, urls: req.files.map((f) => '/uploads/' + f.filename) });
});

module.exports = router;
