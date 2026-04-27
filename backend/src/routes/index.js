const express = require('express');
const router = express.Router();

const sessionRoutes = require('./session');
const slotsRoutes = require('./slots');
const helpRoutes = require('./help');
const hardwareRoutes = require('./hardware');
const adminRoutes = require('./admin');
const setupRoutes = require('./setup');

const extractMachineId = require('../middleware/extractMachineId');

// Mount routes
router.use('/setup', setupRoutes);
router.use('/session', extractMachineId, sessionRoutes);
router.use('/slots', extractMachineId, slotsRoutes);
router.use('/help', extractMachineId, helpRoutes);
router.use('/hardware', extractMachineId, hardwareRoutes);
router.use('/admin', adminRoutes);

module.exports = router;