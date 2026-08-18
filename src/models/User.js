const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/*
  User model. One account on the site.

  I never store the real password. The pre save hook further down hashes it
  with bcrypt first. The field is also set to select: false, which means a
  normal find() will not return it unless I ask for it on purpose.
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
      select: false, // keep the hash out of normal queries
    },
    // role for the whole site. being admin of one group is separate, that is Group.admin
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    bio: { type: String, maxlength: [300, 'Bio is too long'], default: '' },
    avatar: { type: String, default: '/img/default-avatar.svg' },
    location: { type: String, maxlength: [60, 'Location is too long'], default: '' },

    // friends
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // requests other people sent to me
  },
  { timestamps: true }
);

// runs before every save. hashes the password, but only if it actually changed
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// used at login to check a typed password against the saved hash
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
