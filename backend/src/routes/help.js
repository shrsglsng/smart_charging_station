const express = require('express');
const router = express.Router();
const helpTicketRepository = require('../repositories/helpTicketRepository');
const logger = require('../logger/logger');

// POST /api/v1/help/ticket
router.post('/ticket', async (req, res) => {
  const { phone_number, issue_type, description } = req.body;
  const machineId = req.machineId;

  try {
    // Save to HelpTicket collection
    const helpTicketData = {
      machine_id: machineId,
      phone_number: phone_number,
      issue_type: issue_type,
      description: description
    };

    const helpTicket = await helpTicketRepository.create(helpTicketData);

    res.json({ success: true, ticketId: helpTicket._id });
  } catch (error) {
    logger.error('Error in help ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;