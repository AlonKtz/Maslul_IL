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

// Sessions are stored in MongoDB so they survive a server restart.
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

// Makes the logged-in user available to every route and view.
app.use(attachUser);

// ---------------------------------------------------------------- routes
app.use(require('./src/routes/index'));
app.use(require('./src/routes/auth'));
app.use(require('./src/routes/users'));
app.use(require('./src/routes/groups'));
app.use(require('./src/routes/posts'));
app.use(require('./src/routes/cars'));

// ---------------------------------------------------------------- errors
// Must be registered last, after every route.
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------- start
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[server] Maslul running on http://localhost:${PORT}`);
  });
});

// Last-resort guards: log instead of letting the process die.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

module.exports = { app, server, sessionMiddleware };
