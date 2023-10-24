const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/users");
const Role = require("../models/role");
const Admin = require("../models/admin")
const { signJwt, verifyToken } = require("../middlewares/jwt");
const { createLogger, transports, format } = require('winston');
const SuperAdmin = require('../models/superAdmin');
const Withdrawal = require('../models/withdrawal')

const superAdminRouter = express.Router();


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

superAdminRouter.post("/admin/register", async (req, res) => {
    try {
      const { userName, email, password, cPassword} = req.body;
  
      // Check if a super admin with the same email already exists
      const existingSuperAdmin = await SuperAdmin.findOne({ email });
      if (existingSuperAdmin) {
        return res.status(409).json({ message: 'Super admin with this email already exists' });
      }

      if (password !== cPassword) {
        return res.status(400).json({ message: 'Password and confirmation password do not match' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      const superAdminRole = await Role.findOne({ name: 'SuperAdmin' });
      if (!superAdminRole) {
        return res.status(409).json({ message: 'Super admin role not existing' });
      }
  
      // Create a new super admin
      const newSuperAdmin = new SuperAdmin({
        userName,
        email,
        password: hashedPassword,
        cPassword: hashedPassword,
        roleId: superAdminRole._id,
        premium: true,
        role: superAdminRole.name
      });
  
      // Save the new super admin
      await newSuperAdmin.save();
      const token = signJwt({ id: newSuperAdmin._id, email: newSuperAdmin.email });      // Update the premium field of the Content model
    // await Content.updateMany({}, { premium: true });
  
      return res.json({
        message: 'Super admin registered successfully',
        Id: newSuperAdmin._id,
        userName: newSuperAdmin.userName,
        email: newSuperAdmin.email,
        roleId: newSuperAdmin.roleId,
        role: superAdminRole.name,
        premium: newSuperAdmin.premium,
        token: token // Add the premium field to the response and set it to true
      });
    } catch (error) {
      logger.error(error);
      console.error('Registration Error:', error); // Add this line to log the error to the console
      return res.status(500).json({ message: 'Internal Server Error' });
    }
    
  });
  
  superAdminRouter.post("/admin/login", async (req, res) => {
    try {
      const { userName, email, password } = req.body;
  
      // Find the super admin by email and populate the roleId field with role details
      const superAdmin = await SuperAdmin.findOne({ email: email }).populate('roleId');
      if (!superAdmin) {
        return res.status(404).json({ message: 'Super admin not found' });
      }
  
      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
  
      // Set the role field in the superAdmin object
      superAdmin.role = superAdmin.roleId ? superAdmin.roleId.name : "SuperAdmin";
  
      // Generate a JWT token
      const token = signJwt({ id: superAdmin._id, email: superAdmin.email, userName: superAdmin.userName });
  
      // Save the updated superAdmin object
      await superAdmin.save();
  
      return res.json({
        message: 'Super admin logged in successfully',
        userName,
        email,
        role: superAdmin.role,
        token,
      });
    } catch (error) {
      logger.error(error);
      console.error('Login Error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  superAdminRouter.post("/admin/make-admin", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Check if the authenticated user is a super admin
      const superAdminExist = await SuperAdmin.findById(userId);
      if (!superAdminExist) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
  
      const { email,toggle } = req.body;

      const userExist = await User.findOne({ email: email });
      if (!userExist) {
        logger.error(`User not found: ${email}`);
        return res.status(404).json({ message: "User not found" });
      }

         // Check if there is already an admin with the given email
         const existingAdmin = await Admin.findOne({ email: email });
  
         if (existingAdmin) {
           return res.status(409).json({ message: "User is already an admin" });
         }
      if(toggle == userExist.isAdmin) return res.status(409).json({ message: "IsAdmin has already been set to "+ toggle });

      // Update the user's role to "Admin" in the Admin model
      userExist.isAdmin = toggle
    
      // const admin = await Admin.findOneAndUpdate(
      //   { email: email },
      //   { $set: { role: "Admin" } },
      //   { new: true }
      // ).populate('roleId');
  
      // if (!admin) {
      //   // If Admin document doesn't exist, create a new one using user's data
      //   const newUserAdmin = new Admin({
      //     firstName: userExist.firstName,
      //     lastName: userExist.lastName,
      //     email: userExist.email,
      //     password: userExist.password, // Assuming you want to copy the password as well, adjust accordingly
      //     // Copy other relevant fields as needed
      //     role: "Admin",
      //   });
  
      //   await newUserAdmin.save(); // Save the new Admin document
      // }
  
      // // Update the user's role to "Admin"
      // userExist.role = "Admin";
      await userExist.save();
  
      // console.log('Admin:', admin); // Add this line for logging
      return res.json({
        message: `User ${userExist.firstName} has been made an admin`,
        userName: userExist.userName,
        email: userExist.email,
        //role: admin ? admin.role : "Admin", // Handle the case when admin is null
        //adminDetails: admin,
        isAdmin : userExist.isAdmin
      });
    } catch (error) {
      console.error('Error during make-admin operation:', error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  superAdminRouter.post("/admin/approve-withdrawal", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Check if the authenticated user is a super admin
      const superAdminExist = await SuperAdmin.findById(userId);
      const user = await User.findById(userId);
      if (!superAdminExist) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
  
      const { withdrawalId } = req.body;
  
      // Fetch the withdrawal record using the withdrawalId
      const withdrawal = await Withdrawal.findById(withdrawalId);
  
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }

      // Check if the withdrawal is already approved
      if (withdrawal.status === "approved") {
        return res.status(409).json({ message: "Withdrawal is already approved" });
    }
  
      if (user.isPremium === true) {
        // Super admin logic to approve the withdrawal
 withdrawal.status = "approved";
 await withdrawal.save();
 return res.json({
  message: "Withdrawal approved",
  withdrawalDetails: withdrawal,
});
      } else {
        // Check if the user has a role of "Regular" and if the withdrawal amount is not greater than one
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
  
        if (user.isPremium === false && withdrawal.count < 1) {
          // Regular user logic to approve the withdrawal
          withdrawal.status = "approved";
          await withdrawal.save();
          return res.json({
           message: "Withdrawal approved",
           withdrawalDetails: withdrawal,
         });
        } else {
          return res.status(403).json({ message: "Withdrawal cannot be approved" });
        }
      }
    } catch (error) {
      logger.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });

  superAdminRouter.post("/admin/make-premium", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if the authenticated user is a super admin
        const superAdminExist = await SuperAdmin.findById(userId);
        if (!superAdminExist) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        const { email } = req.body;

        const userExist = await User.findOne({ email: email });
        if (!userExist) {
            logger.error(`User not found: ${email}`);
            return res.status(404).json({ message: "User not found" });
        }

        // Update the user's premium status to true
        userExist.isPremium = true;
        await userExist.save();

        return res.json({
            message: `User ${userExist.firstName} has been made premium`,
            userName: userExist.userName,
            email: userExist.email,
            isAdmin: userExist.isAdmin,
            isPremium: true,
        });
    } catch (error) {
        console.error('Error during make-premium operation:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

  superAdminRouter.post("/admin/remove-user", verifyToken, async (req, res) => {
    try {
      const userId = req.user.id;
  
      // Check if the authenticated user is a super admin
      const superAdminExist = await SuperAdmin.findById(userId);
      if (!superAdminExist) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
  
      const { email } = req.body;
  
      // Find the user by their email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: `User ${email} not found` });
      }
  
      // Logic to remove the user
      await User.findByIdAndRemove(user._id);
      return res.json({
        message: `User ${email} has been removed`,
      });
    } catch (error) {
      console.error('Error during remove-user operation:', error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
module.exports = superAdminRouter;
