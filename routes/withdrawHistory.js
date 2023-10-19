const express = require('express');
const User = require('../models/users');
const Withdrawal = require('../models/withdrawal')

const withdrawalHistoryRouter = express.Router();

withdrawalHistoryRouter.get('/transaction-history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Fetch all withdrawal records for the user
      const withdrawals = await Withdrawal.find({ userId });
  
      // Prepare an array to store transaction history
      const transactionHistory = [];
  
      // Iterate through each withdrawal and create transaction history entries
      withdrawals.forEach((withdrawal) => {
        transactionHistory.push({
          userId: withdrawal.userId,
          withdrawalId: withdrawal._id,
          amount: withdrawal.amount,
          type: 'withdrawal',
          date: withdrawal.createdAt,
        });
      });
  
      // Fetch all deposit records for the user (modify this based on your actual deposit model)
      const deposits = await Deposit.find({ userId });
  
      // Iterate through each deposit and create transaction history entries
      deposits.forEach((deposit) => {
        transactionHistory.push({
          userId: deposit.userId,
          withdrawalId: null, // Assuming deposits don't have associated withdrawal IDs
          amount: deposit.amount,
          type: 'deposit',
          date: deposit.createdAt,
        });
      });
  
      // Sort the transaction history entries by date in descending order
      transactionHistory.sort((a, b) => b.date - a.date);
  
      res.status(200).json(transactionHistory);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  module.exports = withdrawalHistoryRouter;