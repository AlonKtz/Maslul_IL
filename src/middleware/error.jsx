/*
  All the error handling in one place. The point is that the server should
  never crash, no matter what somebody types or sends.

  notFound runs when no route matched the url at all.
  errorHandler catches anything a controller passes to next(err). That covers
  async errors too, because every controller wraps its body in try/catch and
  sends the error here.
*/

const wantsJson = require('../utils/wantsJson');

function notFound(req, res) {
  if (wantsJson(req)) {
    return res.status(404).json({ error: 'Not found.' });
  }
  return res.status(404).render('pages/error', {
    title: 'Page not found',
    message: 'The page you were looking for does not exist.',
  });
}

// express only treats a function as an error handler if it takes four
// arguments, so next has to stay here even though it looks unused.
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  let status = err.status || 500;
  let message = 'Something went wrong. Please try again.';

  // a schema rule failed. show the first message so the user gets something clear
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)[0].message;
  }
  // someone put a broken id in the url and it got past the id check
  else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid value provided.';
  }
  // unique index blew up, so the username or group name is already taken
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || { value: '' })[0];
    message = `That ${field} is already taken.`;
  }
  // multer rejected the upload, usually too big or the wrong file type
  else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'The uploaded file is too large (max 2MB).';
  } else if (err.status && err.expose) {
    message = err.message;
  }

  if (wantsJson(req)) {
    return res.status(status).json({ error: message });
  }
  return res.status(status).render('pages/error', { title: 'Error', message });
}

module.exports = { notFound, errorHandler };
