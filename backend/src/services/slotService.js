const Slot = require('../models/Slot');
const { validatePin } = require('../utils/pinValidator');

class SlotService {
  // Get all slots for a machine
  async getSlotsByMachineId(machineId) {
    return Slot.find({ machine_id: machineId }).sort({ slot_number: 1 });
  }

  // Get a specific slot by machine_id and slot_number
  async getSlotByMachineAndSlotNumber(machineId, slotNumber) {
    return Slot.findOne({ machine_id: machineId, slot_number: slotNumber });
  }

  // Assign a slot: set status to PENDING, update user_phone and pin
  async assignSlot(machineId, slotNumber, phoneNumber, pin) {
    // Validate PIN
    if (!validatePin(pin)) {
      throw new Error('Invalid PIN');
    }

    const slot = await Slot.findOneAndUpdate(
      { machine_id: machineId, slot_number: slotNumber },
      {
        status: 'PENDING',
        user_phone: phoneNumber,
        pin: pin,
        session_start: new Date(),
        charging_ends_at: null // Reset charging ends at when assigning
      },
      { returnDocument: 'after' }
    );

    if (!slot) {
      throw new Error('Slot not found');
    }

    return slot;
  }

  // Release a slot: set status to AVAILABLE, wipe user details
  async releaseSlot(machineId, slotNumber) {
    const slot = await Slot.findOneAndUpdate(
      { machine_id: machineId, slot_number: slotNumber },
      {
        status: 'AVAILABLE',
        user_phone: null,
        pin: null,
        session_start: null,
        charging_ends_at: null
      },
      { returnDocument: 'after' }
    );

    if (!slot) {
      throw new Error('Slot not found');
    }

    return slot;
  }

  // Verify phone+slot and release: for "Forgot PIN" flow
  async verifyAndReleaseSlot(machineId, phoneNumber, slotNumber) {
    // Find the slot that matches ALL criteria
    const slot = await Slot.findOne({
      machine_id: machineId,
      user_phone: phoneNumber,
      slot_number: slotNumber,
      status: { $in: ['LOCKED_CHARGING', 'LOCKED_EXPIRED'] }
    });

    if (!slot) {
      throw new Error('No matching session found for this phone and locker');
    }

    // Release the slot if verified
    return this.releaseSlot(machineId, slotNumber);
  }

  // Find an active session by phone_number and machine_id
  async findActiveSessionByPhoneAndMachine(phoneNumber, machineId) {
    return Slot.findOne({
      machine_id: machineId,
      user_phone: phoneNumber,
      status: { $in: ['PENDING', 'LOCKED_CHARGING', 'LOCKED_EXPIRED'] }
    });
  }

  // Find a slot for retrieval by phone_number, pin, and machine_id
  async findSlotForRetrieval(phoneNumber, pin, machineId) {
    return Slot.findOne({
      machine_id: machineId,
      user_phone: phoneNumber,
      pin: pin,
      status: { $in: ['LOCKED_CHARGING', 'LOCKED_EXPIRED'] }
    });
  }

  // Update slot status to LOCKED_CHARGING (when charging starts)
  async lockSlotForCharging(machineId, slotNumber, chargingEndsAt) {
    return Slot.findOneAndUpdate(
      { machine_id: machineId, slot_number: slotNumber },
      {
        status: 'LOCKED_CHARGING',
        charging_ends_at: chargingEndsAt
      },
      { returnDocument: 'after' }
    );
  }

  // Update slot status to LOCKED_EXPIRED (when charging time expires)
  async expireSlot(machineId, slotNumber) {
    return Slot.findOneAndUpdate(
      { machine_id: machineId, slot_number: slotNumber },
      {
        status: 'LOCKED_EXPIRED'
      },
      { returnDocument: 'after' }
    );
  }
}

module.exports = new SlotService();