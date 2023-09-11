const express = require('express')
const bcrypt = require('bcryptjs')
const Admin = require('../models/admin')
const { signJwt, verifyToken } = require("../middlewares/jwt");
const { isAdmin } = require("../middlewares/authAccess");

const users = require('../models/users')
const adminRouter = express.Router()


adminRouter.post('/login', async (req, res) => {
    try {
      console.log(req.body);
      const { email, password } = req.body;
  
      let admin = await Admin.findOne({ email: email });
  
      console.log(admin);
  
      if (admin == null) {
        return res.json({
          message: "User with this email does not exist",
        });
      }
  
      let passwordValid = await bcrypt.compare(password, admin.password);
      if (!passwordValid) {
        return res.json({
          message: "Incorrect password",
        });
      }
  
      var token = signJwt({ id: admin._id, email: admin.email });
      return res.json({
        status: true,
        message: "User logged in successfully",
        data: {
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          token,
          role: admin.role, // Assuming 'role' is a property of the 'admin' object
        },
      });
    } catch (error) {
      // Handle the error appropriately
      console.error(error);
      return res.status(500).json({
        message: "An error occurred during login",
      });
    }
  });
  
  adminRouter.post("/admin/post-content", verifyToken, isAdmin, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if the authenticated user is an Admin
    const AdminExist = await Admin.findById(userId);
    if (!AdminExist) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const { content } = req.body;

    // Logic to post content using the content

    return res.json({
      message: "Content posted"
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
  

module.exports = adminRouter