const { validationResult } = require('express-validator');
const wantsJson = require('../utils/wantsJson');

/*
  This runs straight after the express-validator rules on a route.
  If any rule failed it answers 400 with the messages and stops there, so bad
  data never reaches the controller. This is the server side half of the
  validation, the browser does its own checks first.
*/
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));

  if (wantsJson(req)) {
    return res.status(400).json({ error: errors[0].message, errors });
  }
  return res.status(400).render('pages/error', {
    title: 'Invalid input',
    message: errors.map((e) => e.message).join(', '),
  });
}

/*
  Checks that an id in the url actually looks like a mongo id before I use it.
  Without this, something like /api/cars/abc makes mongoose throw a CastError
  on every request.
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
