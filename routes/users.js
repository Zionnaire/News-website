const express = require("express");
const userRouter = express.Router();
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const Role = require("../models/role");
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const cloudinary = require('cloudinary').v2;
const { signJwt, verifyToken } = require("../middlewares/jwt");
const { createLogger, transports, format } = require('winston');
const Content = require("../models/content")

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

userRouter.post(
  '/register',
  [
    // Validation middleware
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').trim().isEmail().withMessage('Invalid email'),
    body('password').trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('cPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password must match password');
      }
      return true;
    }),
    body('role').custom(async (value) => {
      const regularRole = await Role.findOne({ name: 'Regular' });
      if (!value || value !== regularRole.name) {
        throw new Error('Invalid role');
      }
      return true;
    })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, email, password, cPassword, role } = req.body;

      const userExist = await User.findOne({ email });
      if (userExist) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      if(cPassword !== password){
        return res.json({message: "Confirm password must be same with password"});
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const regularRole = await Role.findOne({ name: 'Regular' });
      const newUser = await User.create({
        firstName,
        lastName,
        email,
        password: hashPassword,
        roleId: regularRole._id, // Convert the ID to ObjectId
        role
      });
      

      return res.json({
        message: `User ${newUser.firstName} has been registered. Congratulations`,
        Id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        roleId: newUser.roleId,
        role: role
      });
    } catch (error) {
      // Handle the error appropriately
      console.error(error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
);

userRouter.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by ID in the database and populate the 'role' field
    const user = await User.findOne({ _id: userId });
    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user data with role name
    return res.json({
      Id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.roleId,
      role: user.roleId.name, // Include the role name from the populated 'roleId'
      isPremuim: user.isPremium,
      isAdmin: user.isAdmin,
      rewardAmount: user.rewardAmount,
      withdrawalDetails: user.withdrawalDetails,
    });
  }  catch (error) {
    // Handle the error appropriately
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

//Get all Users
userRouter.get('/', async (req, res) => {
  try {

    const users = await User.find();
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

let allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];

// Update profile PUT request with image
userRouter.put(
  '/update-profile', verifyToken,
  [
    // Validation middleware for updating profile
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password').optional().trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('cPassword').optional().custom((value, { req }) => {
    if (value && value !== req.body.password) {
      throw new Error('Confirm password must match password');
    }
    return true;
  }),
  ],
  async (req, res) => {

try {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, cPassword } = req.body;

  // Assuming you have a user ID available in req.user.id after authentication
  const userId = req.user.id;
  // Find the user by ID
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update user fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  //let it hash password
 if (password !== undefined && password !== null) user.password = password;

 // Hash password before save
 if (cPassword !== undefined && cPassword !== null) {
  const hashPassword = await bcrypt.hash(cPassword, 10);
  user.password = hashPassword;
 }

  // Extracting the first file from req.files
  const files = req.files ? Object.values(req.files) : [];

  // Check if files is an array and not empty
  if (Array.isArray(files) && files.length > 0) {
    // Check each file for allowed types
    const invalidFiles = files.filter(file => !allowedImageTypes.includes(file.mimetype));
    if (invalidFiles.length > 0) {
      return res.status(400).json({ message: 'Invalid file type' });
    }
    console.log('Files array:', files);

    // If userImage array is empty, push the new file
    if (user.userImage.length === 0) {
      for (const file of files) {
        try {
          const randomId = Math.random().toString(36).substring(2);
          const imageFileName = randomId + file.name;
          const base64Image = `data:${file.mimetype};base64,${file.data.toString('base64')}`;

          const { secure_url: imageUrl, public_id: imageCldId } = await uploadToCloudinary(base64Image, `profile-images/${imageFileName}`);

          // Add the new image object to the userImage array
          user.userImage.push({
            url: imageUrl,
            cld_id: imageCldId,
          });
        } catch (error) {
          console.error('Error uploading image to Cloudinary:', error.message);
          return res.status(500).json({ message: 'Error uploading image to Cloudinary' });
        }
      }
    } else {
      // If userImage array is not empty and no new file is provided, return the existing files
      return res.json({
        message: `User profile updated successfully`,
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userImage: user.userImage,
      });
    }
  }

  // Save the updated user
  await user.save();

  // Send the response
  return res.json({
    message: `User profile updated successfully`,
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userImage: user.userImage,
  });
} catch (error) {
  console.error(error);
  logger.error(error);
  return res.status(500).json({ message: 'Internal Server Error' });
}

  }
);

// Route to reward a user after clicking content 
userRouter.post('/content', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const contentId = req.body.contentId;

  // Find content
  const content = await Content.findById(contentId);
  if (!content) {
    return res.status(404).json({ message: 'Content not found' });
  }

  try {
    // Find the user
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize rewardedContents array if it doesn't exist
    if (!user.rewardedContents) {
      user.rewardedContents = [];
    }

    // Check if the user has already been rewarded for this content
    if (user.rewardedContents.includes(contentId)) {
      return res.status(400).json({ message: 'User has already been rewarded for this content' });
    }
  
    // Update the rewardAmount and add the content to the rewarded list
    user.rewardAmount += 200;
    user.rewardedContents.push(contentId);

    // Save the updated user document
    user = await user.save();

    return res.json({
      message: 'User rewarded successfully',
      userId: user._id,
      rewardAmount: user.rewardAmount,
    });
  } catch (error) {
    console.error('Error in start API:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(base64File, folder) {
  try {
    const { secure_url, public_id } = await cloudinary.uploader.upload(base64File, {folder});
    
    return { secure_url, public_id }
  } catch (error) {
    logger.error(error);
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
}


module.exports = userRouter;