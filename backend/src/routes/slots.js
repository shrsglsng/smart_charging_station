const express = require('express');
const router = express.Router();
const { validatePin } = require('../utils/pinValidator');
const slotService = require('../services/slotService');

// GET /api/v1/slots/state
router.get('/state', async (req, res) => {
  const machineId = req.machineId;

  if (!machineId) {
    return res.status(400).json({ error: 'Missing x-machine-id header' });
  }

  try {
    const slots = await slotService.getSlotsByMachineId(machineId);
    
    // Return the complete list of slots and their statuses
    const slotsState = slots.map(slot => ({
      slot_number: slot.slot_number,
      status: slot.status,
      user_phone: slot.user_phone,
      charging_ends_at: slot.charging_ends_at
    }));
    
    res.json(slotsState);
  } catch (error) {
    console.error('Error in slots state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/slots/assign
router.post('/assign', async (req, res) => {
  const { phone_number, pin, slot_number } = req.body;
  const machineId = req.machineId;

  try {
    // Validate PIN
    if (!validatePin(pin)) {
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    // Update the specific slot: set status to PENDING, update user_phone and pin
    const updatedSlot = await slotService.assignSlot(machineId, parseInt(slot_number), phone_number, pin);

    res.json({ success: true, slot: updatedSlot });
  } catch (error) {
    console.error('Error in slots assign:', error);
    if (error.message === 'Invalid PIN') {
      return res.status(400).json({ error: 'Invalid PIN' });
    }
    if (error.message === 'Slot not found') {
      return res.status(404).json({ error: 'Slot not found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;