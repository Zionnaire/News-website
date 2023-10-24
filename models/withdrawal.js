const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  details: [
    {
      accountNumber: String,
      bankName: String,
      amount: Number,
      withdrawalType: {
        type: String,
        enum: ['bank'], // Use an array for enum
      },
      date: {
        type: String,
        default: new Date().getTime().toString(),
      },
    },
    {
      cryptoAddress: String,
      amount: Number,
      withdrawalType: {
        type: String,
        enum: ['crypto'], // Use an array for enum
      },
      date: {
        type: String,
        default: new Date().getTime().toString(),
      },
    },
  ],

  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'processed', 'rejected'],
    default: 'pending',
  },
  count: {
    type: Number,
  },
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;
