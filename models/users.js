const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  cPassword: {
    type: String,
    // required: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  rewardAmount: {
    type: Number,
    default: 0,
  },
  withdrawalStatus:{
    type: String,
    enum: ['pending', 'processing', 'approved', 'rejected'],
    default: 'pending',
  },
  userImage: [{
    type: {
      url: { type: String },
      cld_id: { type: String },
    },
  }],
  rewardedContents: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
      },
    ],
    default: [],
  }
}, 

{ timestamps: true }) ;

const User = mongoose.model('User', userSchema);

module.exports = User;
