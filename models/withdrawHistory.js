const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  withdrawalRecords: [{
    withdrawalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Withdrawal',
    },
    withdrawalType: String,
    amount: Number,
    available: Number,
    status: String,
    count: Number,
  }],
  date: {
    type: Date,
    default: Date.now,
  },
});

const TransactionHistory = mongoose.model('TransactionHistory', transactionHistorySchema);

module.exports = TransactionHistory;
