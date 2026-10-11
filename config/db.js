const mongoose = require('mongoose');

/*
  Connects to MongoDB using the string in MONGO_URI from the .env file.
  server.js calls this once when the app starts.
  If it cannot connect I stop the process on purpose, because there is no point
  running the site with no database behind it.
*/
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('[db] Missing MONGO_URI. Copy .env.example to .env and set it.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] MongoDB connected');

    // how long one trip to the database takes. every page needs a few of
    // these, so if this number is high the server and the database are too
    // far apart (different regions) and pages will feel slow
    const started = Date.now();
    await mongoose.connection.db.admin().ping();
    console.log(`[db] one round trip to the database takes ${Date.now() - started} ms`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
