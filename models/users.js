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
    require: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  rewardAmount: {
    type: Number,
    default: 0,
  },
  withdrawalCount: {
    type: [
      {
        accountNumber: String,
        bankName: String,
        amount: Number,
        date: {
          type: String,
          default: new Date().getTime().toString(),
        },
      },
    ],
    default: [], // Set as an empty array by default
  },
  userImage: [{
    type: {
      url: { type: String },
      cld_id: { type: String },
    },
  }],
  contentStartTime: {
    type: String,
    default: new Date().getTime().toString(),
  }
}, { timestamps: true }) ;

const User = mongoose.model('User', userSchema);

module.exports = User;
