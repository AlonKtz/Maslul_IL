/**
 * Central error handling (requirement: the server must not crash on bad
 * input or unexpected behaviour).
 *
 * notFound runs when no route matched; errorHandler catches everything a
 * controller passes to next(err) — including async errors, because the
 * controllers wrap their bodies in try/catch.
 */

function notFound(req, res) {
  if (req.xhr || req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found.' });
  }
  return res.status(404).render('pages/error', {
    title: 'Page not found',
    message: 'The page you were looking for does not exist.',
  });
}

// Express identifies an error handler by its four arguments — keep `next`.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  let status = err.status || 500;
  let message = 'Something went wrong. Please try again.';

  // Mongoose validation error -> report the first field message.
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)[0].message;
  }
  // Bad ObjectId that slipped past validateObjectId.
  else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid value provided.';
  }
  // Duplicate key (e.g. username or group name already taken).
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || { value: '' })[0];
    message = `That ${field} is already taken.`;
  }
  // Upload too large / bad file (multer).
  else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'The uploaded file is too large (max 2MB).';
  } else if (err.status && err.expose) {
    message = err.message;
  }

  if (req.xhr || req.path.startsWith('/api') || req.accepts('json') === 'json') {
    return res.status(status).json({ error: message });
  }
  return res.status(status).render('pages/error', { title: 'Error', message });
}

module.exports = { notFound, errorHandler };
