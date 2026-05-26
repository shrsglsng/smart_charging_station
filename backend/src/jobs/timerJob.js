const cron = require('node-cron');
const Slot = require('../models/Slot');
const logger = require('../logger/logger');

/**
 * Timer job to expire charging sessions that have passed their charging_ends_at time
 * Runs every 60 seconds
 */
const expireChargingSessions = async () => {
  try {
    const now = new Date();
    
    // Find all slots where status is LOCKED_CHARGING and charging_ends_at < now
    const expiredSlots = await Slot.find({
      status: 'LOCKED_CHARGING',
      charging_ends_at: { $lt: now }
    });
    
    // Update each expired slot to LOCKED_EXPIRED
    for (const slot of expiredSlots) {
      slot.status = 'LOCKED_EXPIRED';
      await slot.save();
      
      logger.info(`Slot ${slot.slot_number} on machine ${slot.machine_id} expired and set to LOCKED_EXPIRED`);
    }
    
    if (expiredSlots.length > 0) {
      logger.info(`Expired ${expiredSlots.length} charging sessions`);
    }

    // --- NEW: Cleanup Stale PENDING Slots (Strictly only PENDING) ---
    const staleTime = new Date(now.getTime() - 60 * 1000); // 60 seconds ago
    const staleResult = await Slot.updateMany(
      { 
        status: 'PENDING', 
        updatedAt: { $lt: staleTime } 
      },
      {
        $set: {
          status: 'AVAILABLE',
          user_phone: null,
          pin: null,
          session_start: null,
          charging_ends_at: null
        }
      }
    );

    if (staleResult.modifiedCount > 0) {
      logger.info(`BACKGROUND CLEANUP: Reset ${staleResult.modifiedCount} stagnant PENDING slots to AVAILABLE.`);
    }
  } catch (error) {
    logger.error('Error in timer job:', error);
  }
};

// Schedule the job to run every 10 seconds for better responsiveness
const timerJob = cron.schedule('*/10 * * * * *', expireChargingSessions, {
  scheduled: true,
  timezone: "UTC"
});

logger.info('Timer job scheduled to run every 10 seconds for expiring charging sessions');

module.exports = timerJob;