const mongoose = require('mongoose');

// Categories used for group browsing and the advanced group search.
const GROUP_CATEGORIES = [
  'Brand',
  'Off-road',
  'Classic',
  'EV',
  'Racing',
  'Tuning',
  'JDM',
  'General',
];

/**
 * Group model — a community of car lovers (e.g. "BMW Israel", "Off-road IL").
 * `admin` is the member who manages the group (approve joins, moderate posts).
 * Private groups require approval to join and hide their posts from non-members.
 */
const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Group name is too short'],
      maxlength: [50, 'Group name is too long'],
    },
    description: { type: String, maxlength: [500, 'Description is too long'], default: '' },
    category: {
      type: String,
      enum: { values: GROUP_CATEGORIES, message: '{VALUE} is not a valid category' },
      default: 'General',
    },
    brand: { type: String, trim: true, maxlength: [40, 'Brand is too long'], default: '' },
    coverImage: { type: String, default: '/img/default-cover.svg' },

    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // join requests to approve

    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
module.exports.CATEGORIES = GROUP_CATEGORIES;
