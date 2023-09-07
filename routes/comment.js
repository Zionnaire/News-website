const express = require('express');
const Comment = require('../models/comment');
const commentRouter = express.Router();

// Create a new comment
commentRouter.post('/', async (req, res) => {
  try {
    const { content, video, image, author, user } = req.body;
    const newComment = await Comment.create({ content, video, image, author, user });
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all comments
commentRouter.get('/', async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Create a new reply to a comment
commentRouter.post('/:commentId/replies', async (req, res) => {
  try {
    const { content, user } = req.body;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const newReply = { content, user };
    comment.replies.push(newReply);
    await comment.save();

    res.status(201).json(newReply);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all replies of a comment
commentRouter.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const replies = comment.replies;
    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = commentRouter;
