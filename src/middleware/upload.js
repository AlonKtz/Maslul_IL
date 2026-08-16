const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

/**
 * Image uploads (car photos, event covers, listing photos, avatars).
 *
 * Files are written to /public/uploads with a random name — we never reuse
 * the name the browser sent, because it could contain path characters or
 * overwrite somebody else's file.
 */

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, crypto.randomBytes(16).toString('hex') + safeExt);
  },
});

// Only real image types are accepted.
const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEOS = ['video/mp4', 'video/webm', 'video/ogg'];

function filterBy(list, message) {
  return function fileFilter(req, file, cb) {
    if (list.includes(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error(message), { status: 400, expose: true }));
  };
}

const upload = multer({
  storage,
  fileFilter: filterBy(ALLOWED_IMAGES, 'Only JPG, PNG, GIF and WebP images are allowed.'),
  limits: { fileSize: 2 * 1024 * 1024, files: 6 }, // 2MB each, 6 at most
});

// Recap clips are bigger than photos, so they get their own limit and a
// separate destination under /public/video.
const uploadVideo = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, path.join(__dirname, '..', '..', 'public', 'video'));
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ['.mp4', '.webm', '.ogv'].includes(ext) ? ext : '.mp4';
      cb(null, crypto.randomBytes(16).toString('hex') + safeExt);
    },
  }),
  fileFilter: filterBy(ALLOWED_VIDEOS, 'Only MP4, WebM and Ogg video files are allowed.'),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25MB
});

module.exports = upload;
module.exports.video = uploadVideo;
