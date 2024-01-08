const express = require('express');
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const User = require('../models/users');
const { createLogger, transports, format } = require('winston');
const { body } = require('express-validator');
 const { validationResult } = require('express-validator');
const forgetPasswordRouter = express.Router();

// Configure Winston logger
const logger = createLogger({
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'error.log', level: 'error' }),
      new transports.File({ filename: 'combined.log' })
    ],
    format: format.combine(
      format.timestamp(),
      format.json()
    )
  });

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
    res.status(500).send(`Internal Server Error: ${err.message}`);
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

  // Generate a random token
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
       console.log(process.env.EMAIL_USER)
       console.log(process.env.EMAIL_PASSWORD)

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset',
        text: `You are receiving this email because you (or someone else) has requested the reset of the password for your account.
    
        Please click on the following link, or paste this into your browser to complete the process:
    
        http://${req.headers.host}/reset-password/${resetToken}
    
        If you did not request this, please ignore this email and your password will remain unchanged.`
      };
console.log(mailOptions)
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent', resetToken });
    } catch (error) {
      logger.error(error);
      console.error('Forgot Password Route Error:', error.message);
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
        return res.status(400).json({message: 'Invalid token'});
      }

       //let it hash password
 if (password !== undefined && password !== null) user.password = password;

 // Hash password before save
 if (password !== undefined && password !== null) {
  const hashPassword = await bcrypt.hash(password, 10);
  user.password = hashPassword;
 }
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
      res.status(200).json({message: 'Password updated'});
    } catch (error) {
      next(error);
    }
  }
);

// Apply error handling middleware
forgetPasswordRouter.use(errorHandler);

module.exports = forgetPasswordRouter;