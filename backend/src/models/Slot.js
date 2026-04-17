const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true
  },
  slot_number: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'PENDING', 'LOCKED_CHARGING', 'LOCKED_EXPIRED'],
    default: 'AVAILABLE'
  },
  user_phone: {
    type: String,
    default: null
  },
  pin: {
    type: String,
    default: null
  },
  session_start: {
    type: Date,
    default: null
  },
  charging_ends_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create compound unique index on machine_id and slot_number
slotSchema.index({ machine_id: 1, slot_number: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);