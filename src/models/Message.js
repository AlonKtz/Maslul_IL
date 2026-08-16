const mongoose = require('mongoose');

/**
 * Message model — one chat message between two users.
 * Persisted so a conversation survives page reloads; the live delivery
 * itself happens over Socket.io (see src/socket/chat.js).
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

// Fetching a conversation queries by the pair of participants + time order.
messageSchema.index({ from: 1, to: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
