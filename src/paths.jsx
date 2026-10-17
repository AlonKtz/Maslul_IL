const path = require('path');

/*
  The project folder.

  The server code is written in .jsx and compiled into dist/ before it runs,
  so __dirname inside it points at dist/ and not at the folder the source
  file sits in. Every path to views, public or uploads is built from this
  instead. npm scripts and Render both start the app from the project folder.
*/
const ROOT = process.env.APP_ROOT || process.cwd();

module.exports = {
  ROOT,
  VIEWS: path.join(ROOT, 'views'),
  PUBLIC: path.join(ROOT, 'public'),
  UPLOADS: path.join(ROOT, 'public', 'uploads'),
  VIDEO: path.join(ROOT, 'public', 'video'),
};
