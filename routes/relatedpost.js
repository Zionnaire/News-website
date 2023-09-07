const express = require('express');
const Content = require('../models/content');
const relatedPostRouter = express.Router();

// Add related content to a specific content
relatedPostRouter.post('/contents/:id/related-posts', async (req, res) => {
    try {
      const content = await Content.findById(req.params.id);
      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }
      content.relatedPosts.push(req.body.relatedPostId);
      await content.save();
      res.json({ message: 'Related post added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });