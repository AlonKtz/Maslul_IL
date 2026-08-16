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
const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only JPG, PNG, GIF and WebP images are allowed.'), {
    status: 400,
    expose: true,
  }));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 6 }, // 2MB each, 6 at most
});

module.exports = upload;
