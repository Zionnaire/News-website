// Import necessary modules and dependencies
const express = require('express');
const withdrawalRouter = express.Router();
const User = require('../models/users');
const {Withdrawal} = require('../models/withdrawal')
// Withdrawal Route
const mongoose = require('mongoose');
const { verifyToken } = require('../middlewares/jwt');
const TransactionHistory = require("../models/withdrawHistory")


withdrawalRouter.post('/withdraw', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let committed = false;

  try {
    const userId = req.user.id;

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
  
    if (withdrawalType === 'bank') {
      if (!accountNumber || !bankName) {
        return res.status(400).json({ message: 'accountNumber and bankName are required for bank withdrawal' });
      }
     
    } else if (withdrawalType === 'crypto') {
      if (!cryptoAddress) {
        return res.status(400).json({ message: 'cryptoAddress is required for crypto withdrawal' });
      }
      // withdrawalCountItem.cryptoAddress = cryptoAddress;
    }

let withdrawal = await Withdrawal.findOne({userId: userId})
    if(withdrawal !== null){

       // Check if the user is not premium and has already made a withdrawal
    if (!user.isPremium && withdrawal.status === 'approved') {
      return res.status(400).json({ message: 'Free users can only withdraw once' });
    }
    }
    user.rewardAmount = user.rewardAmount - amount;
   await user.save({ session });


   const withdrawalRecord = await Withdrawal.create(
    {
      userId: user._id,
      withdrawalType,
      amount,
      available: user.rewardAmount,
      bankName,
      cryptoAddress: cryptoAddress,
      accountNumber,
    },
    { session }
  );
  
    // console.log(withdrawalRecord);

      // Response includes details of the transaction
      return res.status(200).json({
        message: 'Withdrawal processing',
        status: withdrawalRecord[0].status,
      withdrawalRecord: withdrawalRecord[0]
      });
  } catch (error) {
   
      // Rollback the transaction in case of an error
      await session.abortTransaction();
      session.endSession();
    
    console.error(error);
    return res.status(500).json({ message: 'Withdrawal failed', status: 'rejected' });
  }
});


module.exports = withdrawalRouter;
