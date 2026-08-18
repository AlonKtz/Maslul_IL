const mongoose = require('mongoose');

// the categories a group can have. used in the create form and the search filter
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

/*
  Group model. A group is a community, like "BMW Israel" or "Off-road IL".

  The admin field is the member who runs the group. They are the only one who
  can edit it, approve people who ask to join, or remove someone.
  If a group is private then joining needs approval, and people who are not
  members cannot see what is inside it.
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
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // people waiting for the admin to let them in

    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);
module.exports.CATEGORIES = GROUP_CATEGORIES;
