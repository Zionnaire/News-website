// Import necessary modules and dependencies
const express = require('express');
const withdrawalRouter = express.Router();
const User = require('../models/users');
const {Withdrawal} = require('../models/withdrawal')
// Withdrawal Route
const mongoose = require('mongoose');
const { verifyToken } = require('../middlewares/jwt');
const TransactionHistory = require("../models/withdrawHistory")


// withdrawalRouter.post('/withdraw', verifyToken, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   let committed = false;

//   try {
//     const userId = req.user.id;

//   const { withdrawalType, cryptoAddress, accountNumber, bankName, amount } = req.body;

//   if (!userId || !withdrawalType || !amount) {
//     return res.status(400).json({ message: 'userId, withdrawalType, and amount are required fields' });
//   }

//   const user = await User.findById(userId).select('firstName lastName isPremium').session(session);

//   if (!user) {
//     return res.status(404).json({ message: 'User not found' });
//   }

//   //Check if the user is an admin
//   if (user.isAdmin) {
//     return res.status(403).json({ message: 'Admins are not allowed to withdraw' });
//   }

//   // Check if the withdrawal amount is not equal to the available rewardAmount
//   if (user.rewardAmount < amount) {
//     return res.status(400).json({ message: 'Insufficient reward amount for withdrawal' });
//   }

//   if (amount < user.rewardAmount) {
//     return res.status(400).json({ message: 'User must withdraw all reward Amount' });
//   }


//   user.withdrawalStatus = 'processing';
  
//     if (withdrawalType === 'bank') {
//       if (!accountNumber || !bankName) {
//         return res.status(400).json({ message: 'accountNumber and bankName are required for bank withdrawal' });
//       }
     
//     } else if (withdrawalType === 'crypto') {
//       if (!cryptoAddress) {
//         return res.status(400).json({ message: 'cryptoAddress is required for crypto withdrawal' });
//       }
//       // withdrawalCountItem.cryptoAddress = cryptoAddress;
//     }

// let withdrawal = await Withdrawal.findOne({userId: userId})
//     if(withdrawal !== null){

//        // Check if the user is not premium and has already made a withdrawal
//     if (!user.isPremium && withdrawal.status === 'approved') {
//       return res.status(400).json({ message: 'Free users can only withdraw once' });
//     }
//     }

//     user.rewardAmount = user.rewardAmount - amount;
//    await user.save({ session });


//    const withdrawalRecord = await Withdrawal.create(
//     {
//       userId: user._id,
//       withdrawalType,
//       amount,
//       available: user.rewardAmount,
//       bankName,
//       cryptoAddress: cryptoAddress,
//       accountNumber,
//       balance: user.rewardAmount 
//     },
//     { session }
//   );
  

//   await TransactionHistory.updateOne(
//     { userId: user._id },
//     {
//       $push: {
//         withdrawalRecords: {
//           withdrawalId: withdrawalRecord._id,
//           withdrawalType,
//           amount,
//           available: user.rewardAmount,
//           status: 'pending', // or whatever status you want to set initially
//           count: 1, // or update this based on your logic
//         },
//       },
//     },
//     { upsert: true } // creates the document if it doesn't exist
//   );
//     // console.log(withdrawalRecord);

//       // Response includes details of the transaction
//       return res.status(200).json({
//         message: 'Withdrawal processing',
//         status: withdrawalRecord[0].status,
//         withdrawalRecord: withdrawalRecord[0],
//         fullName: user.firstName + " " + user.lastName,
//         isPremium: user.isPremium,
//       });
//   } catch (error) {
   
//       // Rollback the transaction in case of an error
//       await session.abortTransaction();
//       session.endSession();
    
//     console.error(error);
//     return res.status(500).json({ message: 'Withdrawal failed', status: 'rejected' });
//   }
// });

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

    const user = await User.findById(userId).select('firstName lastName isPremium rewardAmount').session(session);

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
    }

    // Validate and update rewardAmount
    const newRewardAmount = parseFloat(user.rewardAmount) - amount;

    if (isNaN(newRewardAmount) || typeof newRewardAmount !== 'number') {
      return res.status(400).json({ message: 'Invalid reward amount calculation' });
    }

    user.rewardAmount = newRewardAmount;

    let withdrawal = await Withdrawal.findOne({ userId: userId });

    if (withdrawal !== null) {
      // Check if the user is not premium and has already made a withdrawal
      if (!user.isPremium && withdrawal.status === 'approved') {
        return res.status(400).json({ message: 'Free users can only withdraw once' });
      }
    }

    await user.save({ session });

    const withdrawalRecord = await Withdrawal.create(
      {
        userId: user._id,
        withdrawalType,
        amount,
        available: user.rewardAmount,
        bankName,
        cryptoAddress: cryptoAddress,
        accountNumber: accountNumber,
        balance: user.rewardAmount,
        fullName: `${user.firstName} ${user.lastName}`,
        isPremium: user.isPremium,
      },
      { session }
    );

    await TransactionHistory.updateOne(
      { userId: user._id },
      {
        $push: {
          withdrawalRecords: {
            withdrawalId: withdrawalRecord._id,
            withdrawalType,
            fullName: `${user.firstName} ${user.lastName}`,
            amount,
            available: user.rewardAmount,
            status: 'pending', // or whatever status you want to set initially
            count: 1, // or update this based on your logic
          },
        },
      },
      { upsert: true } // creates the document if it doesn't exist
    );

    // Filter out withdrawalRecord objects with only the "status" field
const filteredWithdrawalRecord = withdrawalRecord.filter(record => Object.keys(record).length > 1);

// Response includes details of the transaction
const responsePayload = {
  message: 'Withdrawal processing',
  withdrawalRecord: filteredWithdrawalRecord.map(record => ({
    userId: record.userId,
    cryptoAddress: record.cryptoAddress,
    accountNumber: record.accountNumber,
    amount: record.amount,
    withdrawalType: record.withdrawalType,
    balance: record.balance,
    available: record.available,
    status: record.status,
    withdrawalId: record.id
    // Add other fields you want to include
  })),
  fullName: `${user.firstName} ${user.lastName}`,
  isPremium: user.isPremium,
};
    committed = true; // Update the committed status here if all operations are successful

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (!committed) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error(error);
    return res.status(500).json({ message: 'Withdrawal failed', status: 'rejected' });
  }
});

module.exports = withdrawalRouter;
