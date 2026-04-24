const Slot = require('../models/Slot');
const { validatePin } = require('../utils/pinValidator');

class SlotService {
  // Get all active slots for a machine
  async getSlotsByMachineId(machineId) {
    return Slot.find({ machine_id: machineId, status: { $ne: 'COMPLETED' } }).sort({ slot_number: 1 });
  }

  // Assign a slot to a user (starts a session)
  async assignSlot(machineId, slotNumber, phoneNumber, pin) {
    const now = new Date();
    const staleTime = new Date(now.getTime() - 3 * 60 * 1000); // 3 minutes ago

    // Try to find an AVAILABLE slot OR a PENDING slot that hasn't moved in 3 minutes
    const slot = await Slot.findOneAndUpdate(
      { 
        machine_id: machineId, 
        slot_number: slotNumber, 
        $or: [
          { status: 'AVAILABLE' },
          { status: 'PENDING', updatedAt: { $lt: staleTime } }
        ]
      },
      {
        status: 'PENDING',
        user_phone: phoneNumber,
        pin: pin,
        session_start: now,
        // Reset these in case of takeover
        charging_ends_at: null,
        collected_at: null,
        total_minutes: null
      },
      { returnDocument: 'after' }
    );

    if (!slot) {
      throw new Error('Slot not found or already occupied');
    }

    return slot;
  }
  // Release a slot: mark current as COMPLETED and create new AVAILABLE record
  async releaseSlot(machineId, slotNumber) {
    // 1. Find the active slot record
    const activeSlot = await Slot.findOne({ 
      machine_id: machineId, 
      slot_number: slotNumber,
      status: { $ne: 'COMPLETED' }
    });
    
    if (!activeSlot) {
      throw new Error('No active session found for this slot');
    }

    const now = new Date();
    let totalMinutes = 0;
    let pickupType = 'NORMAL';

    if (activeSlot.session_start) {
      const diffMs = now - activeSlot.session_start;
      totalMinutes = Math.floor(diffMs / (1000 * 60));
      
      // Determine pickup type
      if (totalMinutes < 25) {
        pickupType = 'EARLY';
      } else if (activeSlot.status === 'LOCKED_EXPIRED') {
        pickupType = 'OVERSTAY';
      }
    }

    // 2. Mark current record as COMPLETED
    activeSlot.status = 'COMPLETED';
    activeSlot.collected_at = now;
    activeSlot.total_minutes = totalMinutes;
    activeSlot.pickup_type = pickupType;
    await activeSlot.save();

    // 3. Create a NEW AVAILABLE record for the next user
    const newSlot = await Slot.create({
      machine_id: machineId,
      location: activeSlot.location,
      slot_number: slotNumber,
      status: 'AVAILABLE'
    });

    return newSlot;
  }

  // Verify phone+slot and release: for "Forgot PIN" flow
  async verifyAndReleaseSlot(machineId, phoneNumber, slotNumber) {
    const slot = await Slot.findOne({
      machine_id: machineId,
      user_phone: phoneNumber,
      slot_number: slotNumber,
      status: { $in: ['LOCKED_CHARGING', 'LOCKED_EXPIRED'] }
    });

    if (!slot) {
      throw new Error('No matching session found for this phone and locker');
    }

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
      { machine_id: machineId, slot_number: slotNumber, status: 'PENDING' },
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
      { machine_id: machineId, slot_number: slotNumber, status: 'LOCKED_CHARGING' },
      {
        status: 'LOCKED_EXPIRED'
      },
      { returnDocument: 'after' }
    );
  }
}

module.exports = new SlotService();