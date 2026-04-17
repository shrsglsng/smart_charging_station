const Slot = require('../models/Slot');
const { validatePin } = require('../utils/pinValidator');

class HardwareController {
  // POST /api/v1/hardware/door-state
  async doorState(req, res) {
    const { slot_number, is_closed } = req.body;
    const machineId = req.machineId;

    try {
      // Find the slot
      const slot = await Slot.findOne({ machine_id: machineId, slot_number: slot_number });

      if (!slot) {
        return res.status(404).json({ error: 'Slot not found' });
      }

      // If slot status is PENDING and door is closed, start charging
      if (slot.status === 'PENDING' && is_closed) {
        const chargingEndsAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        slot.status = 'LOCKED_CHARGING';
        slot.session_start = new Date();
        slot.charging_ends_at = chargingEndsAt;
        await slot.save();

        return res.json({ action: 'ENABLE_CHARGING', slot_number: slot.slot_number });
      }

      // If slot status is AVAILABLE (stranger pushed it) and door is closed, unlock door
      if (slot.status === 'AVAILABLE' && is_closed) {
        return res.json({ action: 'UNLOCK_DOOR', slot_number: slot.slot_number });
      }

      // For LOCKED_CHARGING or LOCKED_EXPIRED, or if door is not closed, do nothing
      return res.json({ action: 'NONE' });
    } catch (error) {
      console.error('Error in doorState:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/hardware/sync
  async sync(req, res) {
    const machineId = req.machineId;

    try {
      // Find all slots for this machine, sorted by slot_number
      const slots = await Slot.find({ machine_id: machineId }).sort({ slot_number: 1 });

      // Map to hardware state
      const hardwareState = slots.map(slot => {
        let relay_on = false;
        let lock_engaged = false;

        if (slot.status === 'LOCKED_CHARGING') {
          relay_on = true;
          lock_engaged = true;
        } else if (slot.status === 'LOCKED_EXPIRED') {
          relay_on = false;
          lock_engaged = true;
        }
        // For AVAILABLE and PENDING: both false

        return {
          slot_number: slot.slot_number,
          relay_on,
          lock_engaged
        };
      });

      res.json(hardwareState);
    } catch (error) {
      console.error('Error in sync:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new HardwareController();