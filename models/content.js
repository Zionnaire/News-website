const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: false,
  },
  body: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  category: [
    {
      type: String,
    },
  ],
  images: [
    {
      type:{
        url: {type:String},
        cld_id: {type:String},

      }    }
  ],
  videos: [
    {
      type:{
        url: {type:String},
        cld_id: {type:String},

      }    }
  ],
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
  likesCount: {
    type: Number,
    default: 0, // Initialize the count to 0
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
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
