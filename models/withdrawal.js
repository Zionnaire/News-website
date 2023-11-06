const mongoose = require('mongoose');

const withdrawalStatusEnum = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};
const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
      accountNumber: String,
      bankName: String,
      cryptoAddress: {
        type: String
      },
      amount: Number,
      withdrawalType: {
        type: String,
        enum: ['bank', 'crypto'], // Use an array for enum
      },
      balance: Number,
      available: Number,
status: { type: String, 
  enum: Object.values(withdrawalStatusEnum),
   default: withdrawalStatusEnum.PENDING
 },
  count: {
    type: Number,
  },
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = {Withdrawal, withdrawalStatusEnum};
