const mongoose = require('mongoose');

/**
 * Comments are embedded inside events and listings — they have no meaning on
 * their own, so they are not a separate collection. The schema lives here so
 * both models share exactly the same shape and validation.
 */
const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment is too long'],
    },
  },
  { timestamps: true }
);

module.exports = commentSchema;
