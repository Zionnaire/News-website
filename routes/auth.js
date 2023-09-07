const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/users");
const Role = require("../models/role");
// const Admin = require('../models/admin')
const { signJwt, verifyToken } = require("../middlewares/jwt");
const { createLogger, transports, format } = require('winston');
const { limiter } = require('../middlewares/rate-limit');

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

const authRouter = express.Router();

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    let userExist = await User.findOne({ email: email }).populate('roleId');
    if (!userExist) {
      logger.error(`User not found: ${email}`);
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userExist.password);
    if (!isPasswordValid) {
      logger.error(`Incorrect password for user: ${email}`);
      return res.json({
        status: false,
        message: "Incorrect Password"
      });
    }

    let token = signJwt({ id: userExist._id, email: userExist.email });

    return res.json({
      status: "00",
      message: `Congratulations!! Welcome ${userExist.firstName}`,
      firstName: userExist.firstName,
      lastName: userExist.lastName,
      email: userExist.email,
      role: userExist.roleId ? userExist.roleId.name : "Regular", // Access the role name, default to "Regular" if roleId is not set
      token
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

authRouter.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

let userExist = await Admin.findOne({ email: email }).populate('role');
    let adminRole = await Role.findOne({ name: "Admin" });
    if (!userExist || (userExist.role.name && userExist.role.name.toString() !== adminRole._id.toString())) {
      logger.error(`User is not an Admin: ${email}`);
      return res.json({
        message: "You are not an Admin"
      });
    }

    let isPasswordValid = await bcrypt.compare(password, userExist.password);
    if (!isPasswordValid) {
      logger.error(`Incorrect password for admin: ${email}`);
      return res.json({
        message: "Incorrect Password"
      });
    }

    let token = signJwt({ id: userExist._id,role:adminRole, email: userExist.email });

    return res.json({
      message: `Congratulations!! Welcome ${userExist.firstName}`,
      firstName: userExist.firstName,
      lastName: userExist.lastName,
      email: userExist.email,
      role: userExist.roleId ? userExist.roleId.name : "Admin", // Access the role name, default to "Admin" if roleId is not set
      token
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// authRouter.post("/admin/make-admin", verifyToken, async (req, res) => {
//   try {
//     let userId = req.user.id
//     //const { userId } = req.body;

//     // Check if the authenticated user is an admin
//     if (req.user.role.name !== "Admin") {
//       return res.status(403).json({ message: "Unauthorized access" });
//     }

//     let userExist = await User.findOne({email:req.body.email});
//     let adminRole = await Role.findOne({ name: "Admin" });
//     if (!userExist || !adminRole) {
//       logger.error(`User or Admin role not found`);
//       return res.json({
//         message: "User or Admin role not found"
//       });
//     }

//     userExist.roleId = adminRole._id;
//     await userExist.save();

//     return res.json({
//       message: `User ${userExist.firstName} has been made an admin`,
//       firstName: userExist.firstName,
//       lastName: userExist.lastName,
//       email: userExist.email,
//       role: adminRole.name
//     });
//   } catch (error) {
//     logger.error(error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// });


// Protected route
authRouter.get('/premium-content', verifyToken, async (req, res) => {
  try {
    let userExist = await User.findById(req.user.id)
    if (!userExist) {
      logger.error(`User not found: ${req.user.email}`);
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (!userExist.roleId || userExist.roleId.name !== 'Premium') {
      logger.error(`Access denied to premium content: ${req.user.email}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    logger.info(`Accessed premium content: ${req.user.email}`);
    let token = signJwt({ id: req.user._id, email: req.user.email });

    res.json({
      message: 'Premium content',
      firstName: userExist.firstName,
      lastName: userExist.lastName,
      email: userExist.email,
      role: userExist.roleId.name,
      token: token
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = authRouter;
