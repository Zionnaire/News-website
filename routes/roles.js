const express = require('express')
const Role = require('../models/role')
const roleRouter = express.Router()

roleRouter.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.json({ message: "Name cannot be empty" });
    }

    let checkRoleExists = await Role.findOne({ name });
    if (checkRoleExists) {
      return res.json({ message: `${name} already exists` });
    }

    let newRole;
    if (name === 'SuperAdmin' || name === 'Admin') {
      newRole = await Role.create({ name, canAccessPremiumContent: true });
    } else {
      newRole = await Role.create({ name });
    }

    return res.json({ message: "New role added", newRole });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

  
  roleRouter.get('/', async (req, res) => {
    try {
      const roles = await Role.find();
      return res.json({ message: "Roles fetched successfully", roles });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  });
  
  module.exports = roleRouter;
  