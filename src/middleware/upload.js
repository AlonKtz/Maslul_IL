const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

/*
  Handles image uploads, so car photos, event covers, listing photos and avatars.

  Files go into /public/uploads and I give every one a random name. I never
  keep the name the browser sent. Two reasons: the name could contain slashes
  and try to escape the folder, and two people uploading "car.jpg" would
  overwrite each other.
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

// the only file types I accept
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
  limits: { fileSize: 2 * 1024 * 1024, files: 6 }, // 2MB per file, 6 files max
});

// video clips are much bigger than photos so they get their own settings
// and go into /public/video instead.
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
  limits: { fileSize: 25 * 1024 * 1024, files: 1 }, // 25MB, one at a time
});

module.exports = upload;
module.exports.video = uploadVideo;
