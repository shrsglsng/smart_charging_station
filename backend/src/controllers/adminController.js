const Slot = require('../models/Slot');
const CompletedSession = require('../models/CompletedSession');
const Machine = require('../models/Machine');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
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
      const usageByMachine = await CompletedSession.aggregate([
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
      // Get all machines from the Machine collection
      const machinesList = await Machine.find().sort({ createdAt: -1 });

      const machines = await Promise.all(machinesList.map(async (m) => {
        const totalSlots = await Slot.countDocuments({ machine_id: m.machine_id });
        const availableSlots = await Slot.countDocuments({ machine_id: m.machine_id, status: 'AVAILABLE' });
        const bookedSlots = await Slot.countDocuments({ 
          machine_id: m.machine_id, 
          status: { $in: ['PENDING', 'LOCKED_CHARGING', 'LOCKED_EXPIRED'] } 
        });

        return {
          machine_id: m.machine_id,
          location: m.location,
          password_plain: m.password_plain || '********', // Fallback if plain is missing
          slotCount: totalSlots,
          availableSlots,
          bookedSlots,
          createdAt: m.createdAt
        };
      }));

      res.json({ success: true, machines });
    } catch (error) {
      logger.error('Error fetching machines:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // POST /api/v1/admin/machines
  async createMachine(req, res) {
    try {
      const { machine_id, location, num_slots, machine_password } = req.body;

      if (!machine_id || !location || !num_slots || !machine_password) {
        return res.status(400).json({ success: false, message: 'Missing required fields: machine_id, location, num_slots, and machine_password are required' });
      }

      // Enforce slot count bounds (Vulnerability #15)
      const parsedSlots = parseInt(num_slots);
      if (isNaN(parsedSlots) || parsedSlots <= 0 || parsedSlots > 50) {
        return res.status(400).json({ success: false, message: 'Number of slots must be between 1 and 50' });
      }

      // Enforce format strictly: Must start with C + 2 Numbers (01-99)
      const idRegex = /^C(0[1-9]|[1-9][0-9])$/;
      const upperMachineId = machine_id.toUpperCase();
      const upperLocation = location.toUpperCase();

      if (!idRegex.test(upperMachineId)) {
        return res.status(400).json({ success: false, message: 'Invalid Machine ID format. Must start with capital C followed by 2 numbers (01-99), e.g., C01' });
      }

      // Check if machine already exists in either slots or machine profile
      const existingSlot = await Slot.findOne({ machine_id: upperMachineId });
      const existingMachine = await Machine.findOne({ machine_id: upperMachineId });
      if (existingSlot || existingMachine) {
        return res.status(400).json({ success: false, message: 'Machine ID already exists' });
      }

      // Create the Machine Profile with secure password hashing
      const hashedPassword = await bcrypt.hash(machine_password, 10);
      await Machine.create({
        machine_id: upperMachineId,
        password: hashedPassword,
        password_plain: machine_password,
        location: upperLocation
      });

      // Create Slots (Initial AVAILABLE records)
      const slotPromises = [];
      for (let i = 1; i <= parsedSlots; i++) {
        slotPromises.push(Slot.create({
          machine_id: upperMachineId,
          location: upperLocation,
          slot_number: i,
          status: 'AVAILABLE'
        }));
      }
      await Promise.all(slotPromises);

      res.status(201).json({ success: true, message: 'Machine profile and slots created successfully' });
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
      const history = await CompletedSession.find(filter)
        .sort({ collected_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CompletedSession.countDocuments(filter);

      const formattedHistory = history.map(s => ({
        id: s._id,
        machine_id: s.machine_id,
        slot_number: s.slot_number,
        user_phone: s.user_phone,
        pin: s.pin,
        started_at: s.session_start,
        collected_at: s.collected_at,
        total_minutes: s.total_minutes,
        status: 'COMPLETED'
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
      const { location, num_slots, machine_password } = req.body;

      if (!location || !num_slots) {
        return res.status(400).json({ success: false, message: 'Location and Slot Count are required' });
      }

      // Enforce slot count bounds (Vulnerability #15)
      const newCount = parseInt(num_slots);
      if (isNaN(newCount) || newCount <= 0 || newCount > 50) {
        return res.status(400).json({ success: false, message: 'Number of slots must be between 1 and 50' });
      }

      const upperLocation = location.toUpperCase();
      const upperMachineId = machine_id.toUpperCase();

      // 1. Sync Machine collection details
      const updateFields = { location: upperLocation };
      if (machine_password && machine_password.trim() !== '') {
        updateFields.password = await bcrypt.hash(machine_password, 10);
        updateFields.password_plain = machine_password;
      }
      
      // Try to update machine profile, create if it didn't exist before (for backward compatibility)
      await Machine.findOneAndUpdate(
        { machine_id: upperMachineId },
        { $set: updateFields },
        { upsert: true, new: true }
      );

      // 2. Update location for ALL slots of this machine (active and history)
      await Slot.updateMany({ machine_id: upperMachineId }, { location: upperLocation });
      await CompletedSession.updateMany({ machine_id: upperMachineId }, { location: upperLocation });

      // 3. Adjust Slot Count
      // Get current max slot number for this machine
      const currentActiveSlots = await Slot.find({ machine_id: upperMachineId }).sort({ slot_number: -1 });
      const currentCount = currentActiveSlots.length > 0 ? currentActiveSlots[0].slot_number : 0;

      if (newCount > currentCount) {
        // Add new slots
        const slotPromises = [];
        for (let i = currentCount + 1; i <= newCount; i++) {
          slotPromises.push(Slot.create({
            machine_id: upperMachineId,
            location: upperLocation,
            slot_number: i,
            status: 'AVAILABLE'
          }));
        }
        await Promise.all(slotPromises);
        logger.info(`Machine ${upperMachineId} scaled up: ${currentCount} -> ${newCount}`);
      } else if (newCount < currentCount) {
        // Scale down: Remove AVAILABLE placeholders for slots > newCount
        const result = await Slot.deleteMany({
          machine_id: upperMachineId,
          slot_number: { $gt: newCount },
          status: 'AVAILABLE'
        });
        logger.info(`Machine ${upperMachineId} scaled down. Removed ${result.deletedCount} available slots.`);
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

  // DELETE /api/v1/admin/machines/:machine_id
  async deleteMachine(req, res) {
    try {
      const { machine_id } = req.params;
      const { admin_password } = req.body;

      if (!admin_password) {
        return res.status(400).json({ success: false, message: 'Admin password is required to perform deletion' });
      }

      // 1. Verify currently logged-in Admin's password
      if (!req.user || !req.user.id) {
        return res.status(401).json({ success: false, message: 'Unauthorized action' });
      }

      const adminUser = await User.findById(req.user.id);
      if (!adminUser) {
        return res.status(404).json({ success: false, message: 'Admin user not found' });
      }

      const isMatch = await bcrypt.compare(admin_password, adminUser.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect admin password. Deletion denied.' });
      }

      const upperMachineId = machine_id.toUpperCase();

      // 2. Delete Machine profile from Machine collection
      await Machine.findOneAndDelete({ machine_id: upperMachineId });

      // 3. Delete all Slots from Slot collection
      const deletedSlots = await Slot.deleteMany({ machine_id: upperMachineId });

      logger.info(`Machine DELETED: Kiosk ${upperMachineId} was deleted by Admin ${adminUser.email}. Removed slots: ${deletedSlots.deletedCount}`);

      res.json({ 
        success: true, 
        message: `Machine ${upperMachineId} and all associated slots have been deleted successfully.`,
        deletedCount: deletedSlots.deletedCount
      });
    } catch (error) {
      logger.error('Error deleting machine:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // DELETE /api/v1/admin/sessions/:id
  async deleteHistory(req, res) {
    try {
      const { id } = req.params;

      const deletedSession = await CompletedSession.findByIdAndDelete(id);
      if (!deletedSession) {
        return res.status(404).json({ success: false, message: 'Session history not found' });
      }

      logger.info(`Session History DELETED: Completed session ${id} for machine ${deletedSession.machine_id} was deleted by Admin.`);
      res.json({ success: true, message: 'Completed session history deleted successfully' });
    } catch (error) {
      logger.error('Error deleting session history:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new AdminController();
