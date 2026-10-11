require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./config/db');
const { attachUser } = require('./src/middleware/auth');
const { notFound, errorHandler } = require('./src/middleware/error');

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------- view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------- middleware
// when the site is hosted, the host puts a proxy in front of it that handles
// https. express has to be told to trust that proxy, otherwise it thinks every
// request is plain http and secure cookies would never get sent back.
const inProduction = process.env.NODE_ENV === 'production';
if (inProduction) app.set('trust proxy', 1);

// gzip everything that is text (pages, css, js, json). the big scripts shrink
// to about a third, which matters a lot on a phone
app.use(compression());

// a tiny "are you awake" answer for Render's health check. it sits before the
// logger and the session, so it costs almost nothing.
// /healthz?db=1 also talks to the database. the weekly GitHub job
// (.github/workflows/keep-awake.yml) uses that one, because the free Atlas
// database is paused after 30 days with no connections at all
app.get('/healthz', async (req, res) => {
  res.set('Cache-Control', 'no-store').type('text');
  if (!req.query.db) return res.send('ok');
  try {
    await require('mongoose').connection.db.admin().ping();
    res.send('ok, database ok');
  } catch (err) {
    res.status(503).send('database not reachable');
  }
});

app.use(morgan(inProduction ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// the version of the site, added to the css and js links as ?v=. on Render it
// is the commit being deployed, locally it changes every time the server
// starts. a new version means a new link, so browsers can keep the files for
// a week without ever showing an old one after a deploy
app.locals.assetVersion = (process.env.RENDER_GIT_COMMIT || Date.now().toString(36)).slice(0, 8);

// the static files can be kept by the browser for a week instead of being
// asked for again on every page
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// sessions go in mongo rather than memory, so restarting the server does not
// log everybody out
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'maslul-dev-secret',
  resave: false,
  saveUninitialized: false,
  // touchAfter: only write the session back to the database once a day
  // instead of on every request, one less round trip per page
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, touchAfter: 24 * 60 * 60 }),
  cookie: {
    httpOnly: true, // not readable from JavaScript
    secure: inProduction, // only over https when hosted, plain http is fine locally
    maxAge: 1000 * 60 * 60 * 24 * 7, // one week
  },
});
app.use(sessionMiddleware);

// puts the logged in user on every request and every page
app.use(attachUser);

// the language the page is shown in, from the cookie the language button
// sets. the head partial uses it for lang and dir, public/js/i18n.js does
// the translating. the theme works the same way, see public/js/theme.js
app.use((req, res, next) => {
  const match = /(?:^|;\s*)lang=(he|en)\b/.exec(req.headers.cookie || '');
  res.locals.lang = match ? match[1] : 'en';
  // and the light or dark theme from the theme button. empty means nobody has
  // chosen yet, and the page follows the device setting instead
  const theme = /(?:^|;\s*)theme=(light|dark)\b/.exec(req.headers.cookie || '');
  res.locals.theme = theme ? theme[1] : '';
  next();
});

// ---------------------------------------------------------------- routes
app.use(require('./src/routes/index'));
app.use(require('./src/routes/auth'));
app.use(require('./src/routes/feed'));
app.use(require('./src/routes/users'));
app.use(require('./src/routes/groups'));
app.use(require('./src/routes/events'));
app.use(require('./src/routes/listings'));
app.use(require('./src/routes/cars'));
app.use(require('./src/routes/messages'));
app.use(require('./src/routes/stats'));
app.use(require('./src/routes/admin'));
app.use(require('./src/routes/uploads'));

// ---------------------------------------------------------------- websockets
// the live chat. it shares the express session, which is how the socket knows
// who is connected without trusting anything the browser sends it.
require('./src/socket/chat')(server, sessionMiddleware);

// ---------------------------------------------------------------- errors
// these two have to be last, after every route, or they catch everything
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------- start
const PORT = process.env.PORT || 3000;

connectDB().then(async () => {
  await require('./src/utils/defaultPhotos')();
  server.listen(PORT, () => {
    console.log(`[server] Maslul running on http://localhost:${PORT}`);
  });
});

// last line of defence. if something slips past all the try/catch blocks I
// log it instead of letting the whole server fall over.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

module.exports = { app, server, sessionMiddleware };
