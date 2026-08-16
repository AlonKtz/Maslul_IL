const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User model — an account on Maslul.
 * Passwords are never stored in plain text: the pre-save hook below hashes
 * them with bcrypt, and the field is `select: false` so it is not returned
 * by queries unless explicitly asked for.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
      match: [/^[a-z0-9_]+$/, 'Username may only contain letters, numbers and underscore'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [40, 'Display name is too long'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // do not return the hash by default
    },
    // Site-wide role. Per-group management is handled by Group.admin.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    bio: { type: String, maxlength: [300, 'Bio is too long'], default: '' },
    avatar: { type: String, default: '/img/default-avatar.svg' },
    location: { type: String, maxlength: [60, 'Location is too long'], default: '' },

    // Social graph
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // incoming
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare a plain-text candidate against the stored hash.
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
