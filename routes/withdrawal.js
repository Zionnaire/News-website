// Import necessary modules and dependencies
const express = require('express');
const withdrawalRouter = express.Router();
const User = require('../models/users');
const Withdrawal = require('../models/withdrawal')
// Withdrawal Route
const mongoose = require('mongoose');
const { verifyToken } = require('../middlewares/jwt');

withdrawalRouter.post('/withdraw/:userId', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    const userId = req.params.userId;
    const { withdrawalType, cryptoAddress, accountNumber, bankName, cryptoName, amount } = req.body;

    if (!userId || !withdrawalType || !amount) {
      return res.status(400).json({ message: 'userId, withdrawalType, and amount are required fields' });
    }

    const user = await User.findById(userId).session(session);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

       // Check if the user is an admin
       if (user.isAdmin) {
        return res.status(403).json({ message: 'Admins are not allowed to withdraw' });
      }
      
    // Check if the withdrawal amount is not equal to the available rewardAmount
    if (user.rewardAmount < amount) {
      return res.status(400).json({ message: 'Insufficient reward amount for withdrawal' });
    }

    if(amount < user.rewardAmount){
      return res.status(400).json({message: 'User must withdraw all reward Amount'})
    }

    user.withdrawalStatus = 'processing';

    const withdrawalCountItem = {
      withdrawalType: req.withdrawalType,
      user: `${user.firstName} ${user.lastName}`,
      userId: user._id,
      amount,
    };

    if (withdrawalType === 'bank') {
      if (!accountNumber || !bankName) {
        return res.status(400).json({ message: 'accountNumber and bankName are required for bank withdrawal' });
      }
      withdrawalCountItem.accountNumber = accountNumber;
      withdrawalCountItem.bankName = bankName;
    } else if (withdrawalType === 'crypto') {
      if (!cryptoAddress || !cryptoName) {
        return res.status(400).json({ message: 'cryptoAddress and cryptoName are required for crypto withdrawal' });
      }
      withdrawalCountItem.cryptoAddress = cryptoAddress;
      withdrawalCountItem.cryptoName = cryptoName;
    }

    user.withdrawalDetails.push(withdrawalCountItem);

    // Check if the user is not premium and has already made a withdrawal
    if (!user.isPremium && user.withdrawalDetails.length > 1) {
      return res.status(400).json({ message: 'Free users can only withdraw once' });
    }

    await user.save({ session });

    const withdrawalRecord = await Withdrawal.create(
      {
        userId: user._id,
        withdrawalType: req.withdrawalType,
        amount,
        available: user.rewardAmount,
        status: 'processing',
        count: user.withdrawalDetails.length,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    committed = true;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const isApproved = Math.random() < 1;

    if (isApproved) {
      // Deduct the amount only if the withdrawal is approved
      user.rewardAmount -= amount;
      user.withdrawalStatus = 'approved';
      await user.save();

      withdrawalRecord.status = 'approved';

      // Response includes details of the transaction
      return res.status(200).json({
        message: 'Withdrawal approved',
        status: 'approved',
        withdrawalDetails: withdrawalCountItem,
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
