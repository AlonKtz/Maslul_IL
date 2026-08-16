const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the connection string in process.env.MONGO_URI.
 * Called once on server startup (see server.js). If the connection fails we
 * exit the process, because the app is useless without a database.
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
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
