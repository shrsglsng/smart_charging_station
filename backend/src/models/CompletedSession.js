const mongoose = require('mongoose');

const completedSessionSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    required: true
  },
  slot_number: {
    type: Number,
    required: true
  },
  user_phone: {
    type: String,
    required: true
  },
  pin: {
    type: String,
    required: true
  },
  session_start: {
    type: Date,
    required: true
  },
  charging_ends_at: {
    type: Date,
    default: null
  },
  collected_at: {
    type: Date,
    required: true
  },
  total_minutes: {
    type: Number,
    required: true
  },
  pickup_type: {
    type: String,
    enum: ['NORMAL', 'EARLY', 'OVERSTAY'],
    required: true
  }
}, {
  timestamps: true
});

// Compound index for fast lookup of a machine's session history
completedSessionSchema.index({ machine_id: 1, collected_at: -1 });

module.exports = mongoose.model('CompletedSession', completedSessionSchema);
