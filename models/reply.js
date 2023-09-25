const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  },
  author: {
    type: String,
   },
  body: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reply = mongoose.model('Reply', replySchema);

module.exports = Reply;
