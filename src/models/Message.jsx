const mongoose = require('mongoose');

/*
  Message model. One chat message from one user to another.

  I save every message to the database so the conversation is still there
  after a refresh. Sending them live is a separate thing and happens over
  Socket.io, see src/socket/chat.js.
*/
const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [1000, 'Message is too long'],
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// loading a chat always searches by the two people and sorts by time, so index that
messageSchema.index({ from: 1, to: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
