const Slot = require('../models/Slot');
const logger = require('../logger/logger');

class AdminController {
  // GET /api/v1/admin/stats
  async getStats(req, res) {
    try {
      // Get all machines by distinct machine_id
      const machines = await Slot.distinct('machine_id');
      const totalMachines = machines.length;

      // Get unique locations
      const locations = await Slot.distinct('location');
      
      const activeSlots = await Slot.countDocuments({ 
        status: { $in: ['PENDING', 'LOCKED_CHARGING', 'LOCKED_EXPIRED'] } 
      });
      const availableSlots = await Slot.countDocuments({ status: 'AVAILABLE' });

      // Usage distribution by machine
      const usageByMachine = await Slot.aggregate([
        { $match: { status: 'COMPLETED' } },
        { $group: { _id: '$machine_id', count: { $sum: 1 } } },
        { $project: { machine_id: '$_id', count: 1, _id: 0 } }
      ]);

      res.json({
        totalMachines,
        locations: locations.length,
        active: activeSlots,
        available: availableSlots,
        usageByMachine
      });
    } catch (error) {
      logger.error('Error fetching admin stats:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/v1/admin/machines
  async getAllMachines(req, res) {
    try {
      // Get distinct machines with their locations and current slot counts
      const machines = await Slot.aggregate([
        { $match: { status: { $ne: 'COMPLETED' } } },
        { $group: { 
            _id: '$machine_id', 
            location: { $first: '$location' },
            slotCount: { $sum: 1 },
            createdAt: { $first: '$createdAt' }
          } 
        },
        { $project: { machine_id: '$_id', location: 1, slotCount: 1, createdAt: 1, _id: 0 } },
        { $sort: { createdAt: -1 } }
      ]);
      res.json({ success: true, machines });
    } catch (error) {
      logger.error('Error fetching machines:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // POST /api/v1/admin/machines
  async createMachine(req, res) {
    try {
      const { machine_id, location, num_slots } = req.body;

      if (!machine_id || !location || !num_slots) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // Enforce format: 1 Alphabet + 2 Numbers (01-99)
      const idRegex = /^[A-Z](0[1-9]|[1-9][0-9])$/;
      const upperMachineId = machine_id.toUpperCase();
      const upperLocation = location.toUpperCase();

      if (!idRegex.test(upperMachineId)) {
        return res.status(400).json({ success: false, message: 'Invalid Machine ID format. Must be 1 Alphabet + 2 Numbers (01-99), e.g., A01' });
      }

      // Check if machine already exists
      const existing = await Slot.findOne({ machine_id: upperMachineId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Machine ID already exists' });
      }

      // Create Slots (Initial AVAILABLE records)
      const slotPromises = [];
      for (let i = 1; i <= parseInt(num_slots); i++) {
        slotPromises.push(Slot.create({
          machine_id: upperMachineId,
          location: upperLocation,
          slot_number: i,
          status: 'AVAILABLE'
        }));
      }
      await Promise.all(slotPromises);

      res.status(201).json({ success: true, message: 'Machine and slots created successfully' });
    } catch (error) {
      logger.error('Error creating machine:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // GET /api/v1/admin/history
  async getHistory(req, res) {
    try {
      const { machine_id, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const filter = {};
      if (machine_id && machine_id !== 'ALL MACHINES') {
        filter.machine_id = machine_id;
      }

      // Get COMPLETED records for history
      const historyFilter = { ...filter, status: 'COMPLETED' };
      const history = await Slot.find(historyFilter)
        .sort({ collected_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Slot.countDocuments(historyFilter);

      const formattedHistory = history.map(s => ({
        id: s._id,
        machine_id: s.machine_id,
        slot_number: s.slot_number,
        user_phone: s.user_phone,
        pin: s.pin,
        started_at: s.session_start,
        collected_at: s.collected_at,
        total_minutes: s.total_minutes,
        status: s.status
      }));

      // Get ACTIVE records (Pending, Charging, Expired)
      const activeFilter = { 
        ...filter, 
        status: { $in: ['PENDING', 'LOCKED_CHARGING', 'LOCKED_EXPIRED'] } 
      };

      const activeSessions = await Slot.find(activeFilter)
        .select('_id machine_id slot_number user_phone pin session_start status');

      const formattedActive = activeSessions.map(s => ({
        id: s._id,
        machine_id: s.machine_id,
        slot_number: s.slot_number,
        user_phone: s.user_phone,
        pin: s.pin,
        started_at: s.session_start,
        collected_at: null,
        total_minutes: s.session_start ? Math.floor((new Date() - new Date(s.session_start)) / 60000) : 0,
        status: s.status
      }));

      res.json({
        success: true,
        history: formattedHistory,
        active: formattedActive,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching session history:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // PUT /api/v1/admin/machines/:machine_id
  async updateMachine(req, res) {
    try {
      const { machine_id } = req.params;
      const { location, num_slots } = req.body;

      if (!location || !num_slots) {
        return res.status(400).json({ success: false, message: 'Location and Slot Count are required' });
      }

      const upperLocation = location.toUpperCase();
      const upperMachineId = machine_id.toUpperCase();

      // 1. Update location for ALL slots of this machine (active and history)
      await Slot.updateMany({ machine_id: upperMachineId }, { location: upperLocation });

      // 2. Adjust Slot Count
      // Get current max slot number for this machine
      const currentActiveSlots = await Slot.find({ machine_id, status: { $ne: 'COMPLETED' } }).sort({ slot_number: -1 });
      const currentCount = currentActiveSlots.length > 0 ? currentActiveSlots[0].slot_number : 0;
      const newCount = parseInt(num_slots);

      if (newCount > currentCount) {
        // Add new slots
        const slotPromises = [];
        for (let i = currentCount + 1; i <= newCount; i++) {
          slotPromises.push(Slot.create({
            machine_id,
            location,
            slot_number: i,
            status: 'AVAILABLE'
          }));
        }
        await Promise.all(slotPromises);
        logger.info(`Machine ${machine_id} scaled up: ${currentCount} -> ${newCount}`);
      } else if (newCount < currentCount) {
        // Scale down: Remove AVAILABLE placeholders for slots > newCount
        const result = await Slot.deleteMany({
          machine_id,
          slot_number: { $gt: newCount },
          status: 'AVAILABLE'
        });
        logger.info(`Machine ${machine_id} scaled down. Removed ${result.deletedCount} available slots.`);
      }

      res.json({ success: true, message: 'Machine updated successfully' });
    } catch (error) {
      logger.error('Error updating machine:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // POST /api/v1/admin/sessions/:id/reset
  async resetSession(req, res) {
    try {
      const { id } = req.params;
      
      const slot = await Slot.findById(id);
      if (!slot) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      if (slot.status !== 'PENDING') {
        return res.status(400).json({ success: false, message: 'Only PENDING sessions can be reset' });
      }

      // Reset the slot to AVAILABLE and wipe user data
      slot.status = 'AVAILABLE';
      slot.user_phone = null;
      slot.pin = null;
      slot.session_start = null;
      slot.charging_ends_at = null;
      
      await slot.save();

      logger.info(`Session RESET: Slot ${slot.slot_number} on machine ${slot.machine_id} was cleared by Admin.`);
      res.json({ success: true, message: 'Session reset successfully' });
    } catch (error) {
      logger.error('Error resetting session:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new AdminController();
