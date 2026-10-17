const mongoose = require('mongoose');

/*
  Comments live inside events and listings instead of in their own collection.
  A comment on its own does not mean anything, it always belongs to something.
  I put the schema in its own file so both models use the exact same shape and
  the same validation rules.
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
