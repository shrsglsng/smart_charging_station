const express = require('express');
const router = express.Router();
const { validatePin } = require('../utils/pinValidator');
const slotService = require('../services/slotService');

// POST /api/v1/session/start
router.post('/start', async (req, res) => {
  const { phone_number, pin } = req.body;
  const machineId = req.machineId;

  try {
    // Validate PIN
    if (!validatePin(pin)) {
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    // Check if this phone already has an active session for this machine_id
    const activeSession = await slotService.findActiveSessionByPhoneAndMachine(phone_number, machineId);
    
    if (activeSession) {
      return res.status(400).json({ error: 'Phone number already has an active session' });
    }

    // Success - validation passed and no active session
    res.json({ success: true });
  } catch (error) {
    console.error('Error in session start:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/session/retrieve
router.post('/retrieve', async (req, res) => {
  const { phone_number, pin } = req.body;
  const machineId = req.machineId;

  try {
    // Query DB for matching machine_id, phone_number, and pin (plaintext comparison)
    // where status is LOCKED_CHARGING or LOCKED_EXPIRED
    const slot = await slotService.findSlotForRetrieval(phone_number, pin, machineId);

    if (!slot) {
      return res.status(404).json({ error: 'No matching session found' });
    }

    // Update slot status to AVAILABLE, wipe the user details
    const updatedSlot = await slotService.releaseSlot(machineId, slot.slot_number);

    res.json({ success: true, slot_number: updatedSlot.slot_number });
  } catch (error) {
    console.error('Error in session retrieve:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/session/recover-unlock
router.post('/recover-unlock', async (req, res) => {
  const { phone_number, slot_number } = req.body;
  const machineId = req.machineId;

  try {
    const updatedSlot = await slotService.verifyAndReleaseSlot(machineId, phone_number, parseInt(slot_number));
    res.json({ success: true, slot_number: updatedSlot.slot_number });
  } catch (error) {
    console.error('Error in session recover-unlock:', error);
    if (error.message === 'No matching session found for this phone and locker') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;