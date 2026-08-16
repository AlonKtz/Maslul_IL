const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const upload = require('../middleware/upload');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

const CLIPS_FILE = path.join(__dirname, '..', '..', 'public', 'video', 'clips.json');

/**
 * Image and video upload endpoints. The client uploads first, gets back a
 * URL, and then sends that URL as part of the event/listing/car it is saving.
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

// POST /api/upload/video — a recap clip for the video player.
// The clip is also added to the playlist file the React player reads.
router.post('/api/upload/video', upload.video.single('video'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video was uploaded.' });

    const url = '/video/' + req.file.filename;
    const title = (req.body.title || 'Recap clip').toString().slice(0, 80);

    // Read the current playlist, add the new clip, write it back.
    let clips = [];
    try {
      clips = JSON.parse(await fs.readFile(CLIPS_FILE, 'utf8'));
      if (!Array.isArray(clips)) clips = [];
    } catch (err) {
      clips = []; // no playlist yet, or it was unreadable
    }

    clips.push({ title, src: url });
    await fs.writeFile(CLIPS_FILE, JSON.stringify(clips, null, 2));

    res.status(201).json({ ok: true, url, clips });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
