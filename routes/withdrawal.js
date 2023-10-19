// Import necessary modules and dependencies
const express = require('express');
const withdrawalRouter = express.Router();
const User = require('../models/users');
const Withdrawal = require('../models/withdrawal')
// Withdrawal Route
const mongoose = require('mongoose');
const { verifyToken } = require('../middlewares/jwt');

withdrawalRouter.post('/withdraw/:userId',verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.userId; // Extract userId from URL params
    console.log('userId from params:', userId); // Add this line for logging

    const { withdrawalType, cryptoAddress, accountNumber, bankName, cryptoName, amount } = req.body;

    // Validate the presence of required fields
    if (!userId || !withdrawalType || !amount) {
      return res.status(400).json({ message: 'userId, withdrawalType, and amount are required fields' });
    }

    // Retrieve the user from the database
    const user = await User.findById(userId).session(session);

    // Validate user existence and available balance
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if rewardAmount is less than the withdrawal amount
    if (user.rewardAmount < amount) {
      return res.status(400).json({ message: 'Insufficient reward amount for withdrawal' });
    }

    // Update withdrawal status to "processing"
    user.withdrawalStatus = 'processing';

    // Deduct withdrawal amount from the user's rewardAmount
    user.rewardAmount -= amount;

    // Add a new withdrawal record to the withdrawalCount array based on withdrawal type
    const withdrawalCountItem = {
      withdrawalType,
      user: user._id,
      userId: user._id,
      amount,
    };

    if (withdrawalType === 'bank') {
      // Validate bank-related fields
      if (!accountNumber || !bankName) {
        return res.status(400).json({ message: 'accountNumber and bankName are required for bank withdrawal' });
      }

      withdrawalCountItem.accountNumber = accountNumber;
      withdrawalCountItem.bankName = bankName;
    } else if (withdrawalType === 'crypto') {
      // Validate crypto-related fields
      if (!cryptoAddress || !cryptoName) {
        return res.status(400).json({ message: 'cryptoAddress and cryptoName are required for crypto withdrawal' });
      }

      withdrawalCountItem.cryptoAddress = cryptoAddress;
      withdrawalCountItem.cryptoName = cryptoName;
    }

    user.withdrawalCount.push(withdrawalCountItem);

    // Save the updated user details
    await user.save({ session });

    // Create a new withdrawal record
    const withdrawalRecord = await Withdrawal.create(
      {
        userId: user._id,
        withdrawalType,
        amount,
        available: user.rewardAmount,
        status: 'processing',
        count: user.withdrawalCount.length,
        withdrawalCountItems: [withdrawalCountItem], // Wrap the object in an array
      },
      { session }
    );    
    console.log('user._id:', user._id);

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Simulate processing delay (replace with actual processing logic)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate approval (replace with actual approval logic)
    const isApproved = Math.random() < 1; // Randomly approve 100% of withdrawals

    if (isApproved) {
      // Update withdrawal status to "approved"
      user.withdrawalStatus = 'approved';

      // Save the updated user details
      await user.save();

      // Update withdrawal status to "approved"
      withdrawalRecord.status = 'approved';

      // Save the updated withdrawal details
      await withdrawalRecord.save();

      // Return success response with withdrawal status
      return res.status(200).json({ message: 'Withdrawal approved', status: 'approved' });
    } else {
      // Update withdrawal status to "processed"
      user.withdrawalStatus = 'processed';

      // Return the withdrawn amount to the user's rewardAmount
      user.rewardAmount += amount;

      // Save the updated user details
      await user.save();

      // Update withdrawal status to "processed"
      withdrawalRecord.status = 'processed';

      // Save the updated withdrawal details
      await withdrawalRecord.save();

      // Return success response with withdrawal status
      return res.status(200).json({ message: 'Withdrawal processing', status: 'pending' });
    }
  } catch (error) {
    // Rollback the transaction in case of an error
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    return res.status(500).json({ message: 'Withdrawal failed', status: 'rejected' });
  }
});



// Add any other necessary routes or middleware functions

module.exports = withdrawalRouter;
