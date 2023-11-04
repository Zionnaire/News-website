const express = require('express');
const {Withdrawal} = require('../models/withdrawal')
const { verifyToken } = require('../middlewares/jwt');
const SuperAdmin = require('../models/superAdmin');

const withdrawalHistoryRouter = express.Router();

withdrawalHistoryRouter.get('/', verifyToken, async (req, res) => {
    try {
      const  userId = req.user.id;
      console.log(userId);
  
      // Fetch all withdrawal records for the user
      const withdrawals = await Withdrawal.find({userId: userId });

      res.status(200).json(withdrawals);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  withdrawalHistoryRouter.get('/all', verifyToken, async (req, res) => {
    try{
      const userId = req.user.id
const superAdminExist = await SuperAdmin.findById(userId);
if(!superAdminExist){
  return res.status(403).json({ message: "Unauthorized access" });
}
const allWithdrawals = await Withdrawal.find({})
res.status(200).json(allWithdrawals)
    }
    catch (error){
      console.error(error);
      res.status(500).json({message: 'Internal Server Error'});
    }
  })
  module.exports = withdrawalHistoryRouter;