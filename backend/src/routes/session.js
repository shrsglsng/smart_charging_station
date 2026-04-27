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
    const pinValidation = validatePin(pin);
    if (!pinValidation.isValid) {
      return res.status(400).json({ success: false, message: pinValidation.reason });
    }

    // Check if this phone already has an active session for this machine_id
    const activeSession = await slotService.findActiveSessionByPhoneAndMachine(phone_number, machineId);

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'This mobile number is already using the Charging Station.'
      });
    }

    // Success - validation passed and no active session
    res.json({ success: true });
  } catch (error) {
    console.error('Error in session start:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/session/retrieve
router.post('/retrieve', async (req, res) => {
  const { phone_number, pin } = req.body;
  const machineId = req.machineId;

  try {
    // 1. Check if ANY active session exists for this phone
    const activeSession = await slotService.findActiveSessionByPhoneAndMachine(phone_number, machineId);

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'No active session found for this mobile number.'
      });
    }

    // 2. Query DB for matching machine_id, phone_number, AND pin
    const slot = await slotService.findSlotForRetrieval(phone_number, pin, machineId);

    if (!slot) {
      return res.status(400).json({
        success: false,
        message: "Invalid PIN or PIN doesn't match the mobile number."
      });
    }

    // Update slot status to AVAILABLE, wipe the user details
    const updatedSlot = await slotService.releaseSlot(machineId, slot.slot_number);

    res.json({ success: true, slot_number: updatedSlot.slot_number });
  } catch (error) {
    console.error('Error in session retrieve:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/v1/session/recover-unlock
router.post('/recover-unlock', async (req, res) => {
  const { phone_number, slot_number } = req.body;
  const machineId = req.machineId;

  try {
    // 1. Check if ANY active session exists for this phone
    const activeSession = await slotService.findActiveSessionByPhoneAndMachine(phone_number, machineId);

    if (!activeSession) {
      return res.status(404).json({
        success: false,
        message: 'No active session found for this mobile number.'
      });
    }

    // 2. Attempt verification and release
    const updatedSlot = await slotService.verifyAndReleaseSlot(machineId, phone_number, parseInt(slot_number));
    res.json({ success: true, slot_number: updatedSlot.slot_number });
  } catch (error) {
    console.error('Error in session recover-unlock:', error);
    if (error.message === 'No matching session found for this phone and locker') {
      return res.status(400).json({
        success: false,
        message: 'The Slot Number is invalid for this mobile number.'
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;