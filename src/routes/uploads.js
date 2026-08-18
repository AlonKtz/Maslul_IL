const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const upload = require('../middleware/upload');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

const CLIPS_FILE = path.join(__dirname, '..', '..', 'public', 'video', 'clips.json');

/*
  The upload endpoints for images and video.

  It works in two steps. The browser uploads the file here first and gets a url
  back, then it sends that url as part of the event or listing or car it is
  saving. That way the file is already on disk before the record is created.
*/

router.use(requireLogin);

// POST /api/upload, one image. used for car photos, avatars and event covers
router.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image was uploaded.' });
  res.status(201).json({ ok: true, url: '/uploads/' + req.file.filename });
});

// POST /api/upload/many, several images at once. used for listing photos
router.post('/api/upload/many', upload.array('images', 6), (req, res) => {
  if (!req.files || !req.files.length) {
    return res.status(400).json({ error: 'No images were uploaded.' });
  }
  res.status(201).json({ ok: true, urls: req.files.map((f) => '/uploads/' + f.filename) });
});

// POST /api/upload/video, a clip for the video player.
// it also writes the clip into the playlist file the React player reads,
// so a new upload shows up in the player straight away.
router.post('/api/upload/video', upload.video.single('video'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video was uploaded.' });

    const url = '/video/' + req.file.filename;
    const title = (req.body.title || 'Recap clip').toString().slice(0, 80);

    // read the playlist, add the new clip on the end, write it back out
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
