// Import necessary modules and dependencies
const express = require('express');
const withdrawalRouter = express.Router();
const User = require('../models/users');

// Withdrawal Route
withdrawalRouter.post('/withdraw', async (req, res) => {
  try {
    const { userId } = req.body;

    // Retrieve the user from the database
    const user = await User.findById(userId);

    // Validate user existence and available balance
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is not premium and has already made a withdrawal
    if (!user.isPremium && user.withdrawalCount.length >= 1) {
        return res.status(400).json({ message: 'Withdrawal limit reached' });
      }

    // Check if rewardAmount is less than 10
    if (user.rewardAmount < 10) {
      return res.status(400).json({ message: 'Reward amount must be 10 or greater for withdrawal' });
    }

    // Set withdrawal amount to the user's entire rewardAmount
    const withdrawalAmount = user.rewardAmount;

    // Update withdrawal status to "processing"
    user.withdrawalStatus = 'processing';

    // Deduct withdrawal amount from the user's rewardAmount
    user.rewardAmount -= withdrawalAmount;

    // Save the updated user details
    await user.save();

    // Simulate processing delay (replace with actual processing logic)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate approval (replace with actual approval logic)
    const isApproved = Math.random() < 1; // Randomly approve 100% of withdrawals

    if (isApproved) {
      // Update withdrawal status to "approved"
      user.withdrawalStatus = 'approved';

       // Deduct withdrawal amount from the user's rewardAmount
       user.rewardAmount -= withdrawalAmount;

      // Save the updated user details
      await user.save();

      // Return success response with withdrawal status
      return res.status(200).json({ message: 'Withdrawal approved', status: 'approved' });
    } else {
      // Update withdrawal status to "processed"
      user.withdrawalStatus = 'processed';

      // Return the withdrawn amount to the user's rewardAmount
      user.rewardAmount += withdrawalAmount;

       // Perform the withdrawal operation
    // Update the user's rewardAmount or any other relevant fields
    // Implement the logic to transfer the withdrawal amount to the user's preferred method (e.g., bank transfer, PayPal, etc.)


      // Save the updated user details
      await user.save();

      // Return success response with withdrawal status
      return res.status(200).json({ message: 'Withdrawal processed', status: 'processed' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Withdrawal failed' });
  }
});

// Add any other necessary routes or middleware functions

module.exports = withdrawalRouter;
