const { validationResult } = require('express-validator');

/**
 * Runs after a list of express-validator checks.
 * If any failed, answers 400 with the messages instead of letting bad data
 * reach the controller (requirement: validation on the server side).
 */
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));

  if (req.xhr || req.path.startsWith('/api') || req.accepts('json') === 'json') {
    return res.status(400).json({ error: errors[0].message, errors });
  }
  return res.status(400).render('pages/error', {
    title: 'Invalid input',
    message: errors.map((e) => e.message).join(', '),
  });
}

/**
 * Guards against invalid ObjectId strings in the URL (e.g. /posts/abc).
 * Without this, Mongoose throws a CastError on every malformed id.
 */
function validateObjectId(paramName = 'id') {
  return function checkId(req, res, next) {
    const value = req.params[paramName];
    if (!/^[0-9a-fA-F]{24}$/.test(value)) {
      return res.status(400).json({ error: 'Invalid id.' });
    }
    next();
  };
}

module.exports = { handleValidation, validateObjectId };
