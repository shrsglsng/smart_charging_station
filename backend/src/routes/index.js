const express = require('express');
const router = express.Router();

const sessionRoutes = require('./session');
const slotsRoutes = require('./slots');
const helpRoutes = require('./help');
const hardwareRoutes = require('./hardware');

// Use extractMachineId middleware for all API routes
const extractMachineId = require('../middleware/extractMachineId');
router.use(extractMachineId);

// Mount routes
router.use('/session', sessionRoutes);
router.use('/slots', slotsRoutes);
router.use('/help', helpRoutes);
router.use('/hardware', hardwareRoutes);

module.exports = router;