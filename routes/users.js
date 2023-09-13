const express = require("express");
const userRouter = express.Router();
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const Role = require("../models/role");
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

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
        return res.status(409).json({ message: 'Super admin with this email already exists' });
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

//Get all Users
userRouter.get('/users', async (req, res) => {
  try {

    const users = await User.find()
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = userRouter;