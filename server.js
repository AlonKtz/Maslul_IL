require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { attachUser } = require('./src/middleware/auth');
const { notFound, errorHandler } = require('./src/middleware/error');

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------- view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------------------------------------------------------------- middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// sessions go in mongo rather than memory, so restarting the server does not
// log everybody out
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'maslul-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true, // not readable from JavaScript
    maxAge: 1000 * 60 * 60 * 24 * 7, // one week
  },
});
app.use(sessionMiddleware);

// puts the logged in user on every request and every page
app.use(attachUser);

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

connectDB().then(() => {
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
