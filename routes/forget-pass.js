const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/users');
// const { validationResult } = require('express-validator');
const forgetPasswordRouter = express.Router();

// Validation Middleware
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send('Email required');
  }

  next();
};

// Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
};

// Forgot password route
forgetPasswordRouter.post(
  '/forgot-password',
  validateEmail,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).send('User not found');
      }

      const resetToken = crypto.randomBytes(20).toString('hex');
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
      await user.save();

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset',
        text: `You are receiving this email because you (or someone else) has requested the reset of the password for your account.
    
        Please click on the following link, or paste this into your browser to complete the process:
    
        http://${req.headers.host}/reset-password/${resetToken}
    
        If you did not request this, please ignore this email and your password will remain unchanged.`
      };

      await transporter.sendMail(mailOptions);
      res.status(200).send('Email sent');
    } catch (error) {
      next(error);
    }
  }
);

// Reset password route
forgetPasswordRouter.post(
  '/reset-password/:resetToken',
  async (req, res, next) => {
    try {
      const { resetToken } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
        resetPasswordToken: crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex'),
      });

      if (!user || user.resetPasswordExpire < Date.now()) {
        return res.status(400).send('Invalid token');
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
      res.send('Password updated');
    } catch (error) {
      next(error);
    }
  }
);

// Apply error handling middleware
forgetPasswordRouter.use(errorHandler);

module.exports = forgetPasswordRouter;