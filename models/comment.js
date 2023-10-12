const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    body: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    contentId:{
      type:mongoose.Schema.Types.ObjectId,
      ref: "Content"
    },
    comment:{
      type: String,
    },
    author: {
      type: String,
      
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      
    },
    replies: [replySchema]
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
