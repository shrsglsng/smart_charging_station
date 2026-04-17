const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Station', stationSchema);