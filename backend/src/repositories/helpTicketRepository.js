const HelpTicket = require('../models/HelpTicket');

class HelpTicketRepository {
  // Create a new help ticket
  async create(helpTicketData) {
    const helpTicket = new HelpTicket(helpTicketData);
    return helpTicket.save();
  }

  // Find help tickets by machine_id (optional, for admin viewing)
  async findByMachineId(machineId) {
    return HelpTicket.find({ machine_id: machineId }).sort({ createdAt: -1 });
  }

  // Find help tickets by phone_number (optional, for user history)
  async findByPhoneNumber(phoneNumber) {
    return HelpTicket.find({ phone_number: phoneNumber }).sort({ createdAt: -1 });
  }

  // Update help ticket status
  async updateStatus(id, status) {
    return HelpTicket.findByIdAndUpdate(
      id,
      { status: status },
      { returnDocument: 'after' }
    );
  }
}

module.exports = new HelpTicketRepository();