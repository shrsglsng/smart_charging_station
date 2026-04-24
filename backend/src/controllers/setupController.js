const Slot = require('../models/Slot');
const logger = require('../logger/logger');

class SetupController {
  async registerStation(req, res) {
    try {
      const { machine_id, location } = req.body;
      
      if (!machine_id) {
        return res.status(400).json({ success: false, message: 'machine_id is required' });
      }

      const updateData = {};
      if (location) updateData.location = location;

      // In the unified model, we update the location on all slots for this machine
      const result = await Slot.updateMany(
        { machine_id: machine_id.toUpperCase() },
        updateData
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: 'Machine not found. Register via Admin Dashboard first.' });
      }

      logger.info(`Station location updated: ${machine_id} to ${location}`);
      res.status(200).json({ success: true, message: 'Location updated successfully' });
    } catch (error) {
      logger.error('Error during station setup:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new SetupController();
