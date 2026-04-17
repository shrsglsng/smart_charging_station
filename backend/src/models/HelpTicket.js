const mongoose = require('mongoose');

const helpTicketSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true
  },
  phone_number: {
    type: String,
    required: true
  },
  issue_type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'RESOLVED'],
    default: 'OPEN'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HelpTicket', helpTicketSchema);