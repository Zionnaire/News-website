const express = require('express');
const Comment = require('../models/comment');
const Content = require('../models/content')
const commentRouter = express.Router();

// Create a new comment for a specific content
commentRouter.post('/:contentId/comments', async (req, res) => {
  try {
    const { contentId } = req.params; // Get the content ID from the URL
    const { content, video, image, author, user } = req.body;

    // Check if the content with the given ID exists
    const existingContent = await Content.findById(contentId);

    if (!existingContent) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Create a new comment associated with the content
    const newComment = await Comment.create({
      content: contentId, // Associate the comment with the content
      contentType: existingContent.category, // You can store the content type if needed
      content, video, image, author, user
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Comment Error:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Get all comments for a specific content or implement pagination
commentRouter.get('/', async (req, res) => {
  try {
    const { contentId } = req.query; // Get the content ID from query parameters if provided

    let comments;

    if (contentId) {
      // If contentId is provided, fetch comments associated with that content
      comments = await Comment.find({ content: contentId });
    } else {
      // If no contentId is provided, fetch all comments (consider pagination for scalability)
      comments = await Comment.find();
    }

    res.json(comments);
  } catch (error) {
    console.error('Comment Error:', error.message);
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
