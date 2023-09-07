const mongoose = require('mongoose')

const AdminSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  cPassword:{
    type: String,
    require: true,
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },
  isPremium: {
    type: Boolean,
    default: true
  },
    role: {
        type: String,
default: "Admin"
    }
})

module.exports = mongoose.model('Admin', AdminSchema)