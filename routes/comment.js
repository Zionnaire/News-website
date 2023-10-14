const express = require('express');
const Comment = require('../models/comment');
const Content = require('../models/content')
const User = require('../models/users')
const { signJwt, verifyToken } = require("../middlewares/jwt");
const commentRouter = express.Router();

// Create a new comment for a specific content
commentRouter.post('/:contentId/comments', verifyToken, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id; // Extract user ID from the verified token

    // Check if the content with the given ID exists
    const existingContent = await Content.findById(contentId);

    if (!existingContent) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Use Mongoose to find the user by userId
    console.log(userId)
    const user = await User.findById(userId);
    console.log(user)

    if (!user) {
      return res.status(404).json({ message: "You're not registered user" });
    }

    // Determine the author based on user properties
    let author = user.userName; // Default to userName
    if (!author) {
      // If userName is not available, use the combination of firstName and lastName
      author = user.firstName;
    }

    // Create a new comment associated with the content and include the user as the author
    const newComment = new Comment({
      content: contentId, // Associate the comment with the content
      contentType: existingContent.category, // You can store the content type if needed
      content,
      video,
      image,
      author, // Set the author based on the logic above
    });

    const savedComment = await newComment.save();

    res.status(201).json(savedComment);
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
commentRouter.post('/:commentId/replies', verifyToken, async (req, res) => {
  try {
    const { replyBody } = req.body;
    const { commentId } = req.params;
    const userId = req.user.id; // Extract user ID from the verified token

    // Find the user based on the user ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Determine the author based on user properties
    let author = user.userName || user.firstName; // Default to userName or firstName

    const newReply = { replyBody, user, author };
    comment.replies.push(newReply);
    await comment.save();

    // Return the user who replied with the reply content
    const updatedComment = await Comment.findById(commentId).populate('replies.user', 'userName firstName');
    
    // Check if the user exists and has _id before trying to find the replied user
    const repliedUser = user && user._id
      ? updatedComment.replies.find(reply => reply.user && reply.user._id && reply.user._id.toString() === user._id.toString())
      : null;

    res.status(201).json({ repliedUser, replyBody });
  } catch (error) {
    console.error(error); // Log the error to the console for debugging
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
