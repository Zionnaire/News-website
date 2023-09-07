const express = require('express')
const bcrypt = require('bcryptjs')
const Admin = require('../models/admin')
const roles = require('../models/role')
const { signJwt } = require('../middlewares/jwt')
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
  
  
//   adminRouter.post('/register', async (req, res) => {
//     try {
//       const { userName, email, password, cPassword, role } = req.body;
  
//       let emailExists = await Admin.findOne({ email: email });
//       let nameExist = await Admin.findOne({ userName: userName });
//       console.log(nameExist);
  
//       if (nameExist) {
//         return res.json({
//           message: "Username already exists",
//         });
//       }
  
//       if (emailExists) {
//         return res.json({
//           message: "Email already exists",
//         });
//       }
  
//       if (!password) {
//         return res.json({ message: "Password can't be empty" });
//       }
  
//       if (cPassword !== password) {
//         return res.json({ message: "Confirm Password has to match Password" });
//       }
  
//       let hashedPassword = await bcrypt.hash(password, 10);
//       let createNewAdmin = await Admin.create({
//         userName: userName,
//         email: email,
//         password: hashedPassword,
//       });
  
//       let token = signJwt({ id: createNewAdmin._id, email });
//       return res.json({
//         msg: {
//           message: "User successfully registered",
//           status: true,
//         },
//         data: {
//           userName: createNewAdmin.userName,
//           email: createNewAdmin.email,
//           accessToken: token,
//           role: createNewAdmin.role, // Assuming 'role' is a property of the 'createNewAdmin' object
//         },
//       });
//     } catch (error) {
//       // Handle the error appropriately
//       console.error(error);
//       return res.status(500).json({
//         message: "An error occurred during registration",
//       });
//     }
//   });
  

module.exports = adminRouter