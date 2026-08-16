const mongoose = require('mongoose');

// Comments are embedded in the post (they have no meaning on their own).
const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: [500, 'Comment is too long'] },
  },
  { timestamps: true }
);

/**
 * Post model — a piece of content in the feed.
 * A post either belongs to a group (`group` set) or is a personal/profile
 * post (`group` null). `likes` holds the users who liked it.
 */
const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    text: {
      type: String,
      required: [true, 'Post text is required'],
      trim: true,
      maxlength: [1000, 'Post is too long'],
    },
    image: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Speeds up feed and date-range searches (both sort/filter by createdAt).
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
