const Slot = require('../models/Slot');

class SlotRepository {
  // Find slots by machine_id (current active ones)
  async findByMachineId(machineId) {
    return Slot.find({ machine_id: machineId, status: { $ne: 'COMPLETED' } });
  }

  // Find a slot by machine_id and slot_number (current active one)
  async findByMachineIdAndSlotNumber(machineId, slotNumber) {
    return Slot.findOne({ machine_id: machineId, slot_number: slotNumber, status: { $ne: 'COMPLETED' } });
  }

  // Find an active session by phone_number and machine_id
  async findActiveSessionByPhoneAndMachine(phoneNumber, machineId) {
    return Slot.findOne({
      machine_id: machineId,
      user_phone: phoneNumber,
      status: { $in: ['PENDING', 'LOCKED_CHARGING', 'LOCKED_EXPIRED'] }
    });
  }

  // Find a slot by phone_number, pin, and machine_id for retrieval
  async findSlotForRetrieval(phoneNumber, pin, machineId) {
    return Slot.findOne({
      machine_id: machineId,
      user_phone: phoneNumber,
      pin: pin,
      status: { $in: ['LOCKED_CHARGING', 'LOCKED_EXPIRED'] }
    });
  }

  // Update a slot by its ID
  async updateById(id, updateData) {
    return Slot.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
  }

  // Update a slot by machine_id and slot_number (only if not completed)
  async updateByMachineAndSlot(machineId, slotNumber, updateData) {
    return Slot.findOneAndUpdate(
      { machine_id: machineId, slot_number: slotNumber, status: { $ne: 'COMPLETED' } },
      updateData,
      { returnDocument: 'after' }
    );
  }

  // Create a new slot (if needed, though we assume slots are pre-created)
  async create(slotData) {
    const slot = new Slot(slotData);
    return slot.save();
  }
}

module.exports = new SlotRepository();