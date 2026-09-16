const mongoose = require('mongoose');

/*
  Setting model.
  A tiny key/value store for things the site needs to remember that do not
  belong to any member, like which YouTube video is the current recap and when
  it was last checked. One document per key.
*/
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, default: '' },
  },
  { timestamps: true }   // updatedAt tells us how old the value is
);

module.exports = mongoose.model('Setting', settingSchema);
