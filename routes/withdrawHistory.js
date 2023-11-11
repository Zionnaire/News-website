const express = require('express');
const {Withdrawal} = require('../models/withdrawal')
const { verifyToken } = require('../middlewares/jwt');
const User = require('../models/users');
const SuperAdmin = require('../models/superAdmin');
const TransactionHistory = require("../models/withdrawHistory")

const withdrawalHistoryRouter = express.Router();

withdrawalHistoryRouter.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('firstName lastName isPremium rewardAmount');

    // Fetch all withdrawal records for the user from the Withdrawal model
    const withdrawals = await Withdrawal.find({ userId: userId });

    // Fetch withdrawal records from the TransactionHistory model
    const transactionHistory = await TransactionHistory.findOne({ userId: userId });

    // Combine both sets of withdrawal records
const combinedWithdrawals = new Map();


withdrawals.forEach((withdrawal) => {
  if (withdrawal._id) {
    combinedWithdrawals.set(withdrawal._id.toString(), {
      withdrawalId: withdrawal._id,
      withdrawalType: withdrawal.withdrawalType,
      fullName: `${user.firstName} ${user.lastName}`,
      isPremium: user.isPremium,
      amount: withdrawal.amount,
      available: withdrawal.available,
      status: withdrawal.status,
      date: withdrawal.createdAt,
    });
  }
});

if (transactionHistory) {
  // Add unique transactionWithdrawals to the result
  transactionHistory.withdrawalRecords.forEach((transactionWithdrawal) => {
    if (transactionWithdrawal && transactionWithdrawal.withdrawalId) {
      if (!combinedWithdrawals.has(transactionWithdrawal.withdrawalId.toString())) {
        combinedWithdrawals.set(transactionWithdrawal.withdrawalId.toString(), {
          withdrawalId: transactionWithdrawal.withdrawalId,
          withdrawalType: transactionWithdrawal.withdrawalType,
          fullName: `${user.firstName} ${user.lastName}`,
          isPremium: user.isPremium,
          amount: transactionWithdrawal.amount,
          available: transactionWithdrawal.available,
          status: transactionWithdrawal.status,
          date: transactionWithdrawal.createdAt,
        });
      }
    }
  });
}

// Convert the map values back to an array
const uniqueWithdrawalsArray = Array.from(combinedWithdrawals.values());

// Sort the combined withdrawals by date in descending order
uniqueWithdrawalsArray.sort((a, b) => b.date - a.date);

res.status(200).json(uniqueWithdrawalsArray);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


withdrawalHistoryRouter.get('/all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const superAdminExist = await SuperAdmin.findById(userId);

    if (!superAdminExist) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const allWithdrawals = await Withdrawal.find({}).populate('userId', 'firstName lastName');

    res.status(200).json(allWithdrawals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  module.exports = withdrawalHistoryRouter;