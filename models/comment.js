const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    content: {
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
    // content: {
    //   type: String,
    //   required: true
    // },
    // video: {
    //   type: String
    // },
    // image: {
    //   type: String
    // },
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
