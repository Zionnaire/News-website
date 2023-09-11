const mongoose = require('mongoose');

// Define content_metadata schema
const contentMetadataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  category: [
    {
      type: String,
    },
  ],
  images: [
    {
      type: Object,
    },
  ],
  videos: [
    {
      type: Object,
    },
  ],
});

// Create content_metadata model
const ContentMetadata = mongoose.model('ContentMetadata', contentMetadataSchema);

// Define content schema with references to content_metadata
const contentSchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
  },
  premium: {
    type: Boolean,
    default: false,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  views: {
    type: Number,
    default: 0,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  publishedStatus: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  },
  seo: {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    canonicalUrl: {
      type: String,
    },
    keywords: [
      {
        type: String,
      },
    ],
  },
  socialShares: {
    facebookShares: {
      type: Number,
      default: 0,
    },
    twitterShares: {
      type: Number,
      default: 0,
    },
    instagramShare: {
      type: Number,
      default: 0,
    },
    // Add more social media shares as needed
  },
  revisionHistory: [
    {
      version: {
        type: Number,
        required: true,
      },
      body: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Reference to content_metadata
  metadata: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentMetadata',
  },
});

// Create content model
const Content = mongoose.model('Content', contentSchema);

module.exports = { Content, ContentMetadata };
