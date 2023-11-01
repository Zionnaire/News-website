// Import necessary modules and dependencies
const express = require('express');
const withdrawalRouter = express.Router();
const User = require('../models/users');
const Withdrawal = require('../models/withdrawal')
// Withdrawal Route
const mongoose = require('mongoose');
const { verifyToken } = require('../middlewares/jwt');
const TransactionHistory = require("../models/withdrawHistory")


withdrawalRouter.post('/withdraw/:userId', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    const userId = req.params.userId;

    // Check if the person initiating the request is the actual user
    // if (userId !== authenticatedUserId) {
    //   return res.status(403).json({ message: 'Unauthorized access: You can only withdraw for your own account' });
    // }
  const { withdrawalType, cryptoAddress, accountNumber, bankName, amount } = req.body;

  if (!userId || !withdrawalType || !amount) {
    return res.status(400).json({ message: 'userId, withdrawalType, and amount are required fields' });
  }

  const user = await User.findById(userId).session(session);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  //Check if the user is an admin
  if (user.isAdmin) {
    return res.status(403).json({ message: 'Admins are not allowed to withdraw' });
  }

  // Check if the withdrawal amount is not equal to the available rewardAmount
  if (user.rewardAmount < amount) {
    return res.status(400).json({ message: 'Insufficient reward amount for withdrawal' });
  }

  if (amount < user.rewardAmount) {
    return res.status(400).json({ message: 'User must withdraw all reward Amount' });
  }

  user.withdrawalStatus = 'processing';

const withdrawalCountItem = {
    withdrawalId: new mongoose.Types.ObjectId(), // Generate a new ObjectId as withdrawalId
      withdrawalType: req.withdrawalType,
      user: `${user.firstName} ${user.lastName}`,
      userId: user._id,
      amount,
      available: user.rewardAmount,
      withdrawalTime: new Date().toISOString(), // Include withdrawal time
    };
    console.log("Generated withdrawalId:", withdrawalCountItem.withdrawalId);
       
    if (withdrawalType === 'bank') {
      if (!accountNumber || !bankName) {
        return res.status(400).json({ message: 'accountNumber and bankName are required for bank withdrawal' });
      }
      withdrawalCountItem.accountNumber = accountNumber;
      withdrawalCountItem.bankName = bankName;
    } else if (withdrawalType === 'crypto') {
      if (!cryptoAddress) {
        return res.status(400).json({ message: 'cryptoAddress and cryptoName are required for crypto withdrawal' });
      }
      withdrawalCountItem.cryptoAddress = cryptoAddress;
    }

    user.withdrawalDetails.push(withdrawalCountItem);

    // Check if the user is not premium and has already made a withdrawal
    if (!user.isPremium && user.withdrawalDetails.length > 1) {
      return res.status(400).json({ message: 'Free users can only withdraw once' });
    }

    await user.save({ session });

    const withdrawalRecord = await Withdrawal.create(
      [
        {
          withdrawalId: withdrawalCountItem.withdrawalId, // Save the withdrawalId in the Withdrawal model
          userId: user._id,
          withdrawalType: req.withdrawalType,
          amount,
          available: user.rewardAmount,
          status: 'processing',
          count: user.withdrawalDetails.length,
        },
      ],
      { session }
    );


// Find or create a TransactionHistory document for the user
let transactionHistory = await TransactionHistory.findOne({ userId: user._id }).session(session);

if (!transactionHistory) {
  // Create a new TransactionHistory document if not found
  transactionHistory = await TransactionHistory.create({ userId: user._id, withdrawalRecords: [] }, { session });
}

// Ensure withdrawalRecords is an array before pushing
transactionHistory.withdrawalRecords = transactionHistory.withdrawalRecords || [];

// Push the withdrawalRecord into the withdrawalRecords array
transactionHistory.withdrawalRecords.push({
  withdrawalId: withdrawalCountItem.withdrawalId,
  withdrawalType: req.withdrawalType,
  amount,
  available: user.rewardAmount,
  status: 'processing',
  count: user.withdrawalDetails.length,
});

// Save the updated TransactionHistory document
await transactionHistory.save();


await session.commitTransaction();
session.endSession();
committed = true;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const isApproved = Math.random() < 1;

    if (isApproved) {
      // Deduct the amount only if the withdrawal is approved
      user.rewardAmount -= amount;
      user.withdrawalStatus = 'processing';
      await user.save();

      withdrawalRecord.status = 'processing';

      const withdrawalDetails = withdrawalRecord.details || [];
const bankWithdrawal = withdrawalDetails.find(detail => detail.withdrawalType === 'bank');
const cryptoWithdrawal = withdrawalDetails.find(detail => detail.withdrawalType === 'crypto');

const date = bankWithdrawal ? bankWithdrawal.date : (cryptoWithdrawal ? cryptoWithdrawal.date : null);


      // Response includes details of the transaction
      return res.status(200).json({
        message: 'Withdrawal processing',
        status: 'pending',
        withdrawalDetails: {
          ...withdrawalCountItem,
          date: date // Access the date from the details array
        },
      });
    } else {
      user.withdrawalStatus = 'processing';
      withdrawalRecord.status = 'processing';

      return res.status(200).json({ message: 'Withdrawal processing', status: 'pending' });
    }
  } catch (error) {
    if (!committed) {
      // Rollback the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
    }
    console.error(error);
    return res.status(500).json({ message: 'Withdrawal failed', status: 'rejected' });
  }
});


module.exports = withdrawalRouter;
