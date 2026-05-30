const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  password_plain: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Machine', machineSchema);
