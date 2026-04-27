const Slot = require('../models/Slot');
const { validatePin } = require('../utils/pinValidator');
const logger = require('../logger/logger');

class HardwareController {
  // POST /api/v1/hardware/door-state
  async doorState(req, res) {
    const { slot_number, is_closed } = req.body;
    const machineId = req.machineId;

    try {
      // Find the active/pending slot (Ignore history)
      const slot = await Slot.findOne({ 
        machine_id: machineId, 
        slot_number: slot_number,
        status: { $ne: 'COMPLETED' }
      });

      if (!slot) {
        logger.error(`Hardware reported state for non-existent slot ${slot_number} on machine ${machineId}`);
        return res.status(404).json({ error: 'Slot not found' });
      }

      // Case 1: Session START (Door closed during PENDING)
      if (slot.status === 'PENDING' && is_closed) {
        const chargingEndsAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        slot.status = 'LOCKED_CHARGING';
        slot.session_start = new Date();
        slot.charging_ends_at = chargingEndsAt;
        await slot.save();

        logger.info(`Session STARTED: Slot ${slot.slot_number} on machine ${machineId} is now charging.`);
        return res.json({ action: 'ENABLE_CHARGING', slot_number: slot.slot_number });
      }

      // Case 2: Unauthorized Closure (Door closed during AVAILABLE)
      if (slot.status === 'AVAILABLE' && is_closed) {
        logger.warn(`SECURITY ALERT: Unauthorized closure detected on AVAILABLE slot ${slot_number} on machine ${machineId}. Triggering UNLOCK.`);
        return res.json({ action: 'UNLOCK_DOOR', slot_number: slot.slot_number });
      }

      // Case 3: Manual Override / Forced Opening (Door opened during LOCKED state)
      if ((slot.status === 'LOCKED_CHARGING' || slot.status === 'LOCKED_EXPIRED') && !is_closed) {
        logger.error(`MANUAL OVERRIDE: Door opened for slot ${slot_number} on machine ${machineId} without server command.`);
        
        // 1. Complete the current session (Archive it)
        slot.status = 'COMPLETED';
        slot.collected_at = new Date();
        // Calculate total time
        if (slot.session_start) {
          const start = new Date(slot.session_start);
          const end = new Date();
          slot.total_minutes = Math.floor((end - start) / 60000);
        }
        await slot.save();

        // 2. Spawn a new AVAILABLE slot for this locker
        await Slot.create({
          machine_id: slot.machine_id,
          location: slot.location,
          slot_number: slot.slot_number,
          status: 'AVAILABLE'
        });

        logger.info(`Slot ${slot.slot_number} on machine ${machineId} has been reset to AVAILABLE due to manual opening.`);
        return res.json({ action: 'NONE', message: 'Manual override handled' });
      }

      // For any other state (like AVAILABLE and staying open), do nothing
      return res.json({ action: 'NONE' });
    } catch (error) {
      logger.error('Error in doorState:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/v1/hardware/sync
  async sync(req, res) {
    const machineId = req.machineId;

    try {
      // Find all ACTIVE slots for this machine (exclude COMPLETED history), sorted by slot_number
      const slots = await Slot.find({ 
        machine_id: machineId,
        status: { $ne: 'COMPLETED' }
      }).sort({ slot_number: 1 });

      logger.info(`Sync requested by machine ${machineId}. Returning state for ${slots.length} slots.`);

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
      logger.error('Error in sync:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new HardwareController();