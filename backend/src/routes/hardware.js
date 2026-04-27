const express = require('express');
const router = express.Router();
const hardwareController = require('../controllers/hardwareController');
const extractMachineId = require('../middleware/extractMachineId');

// Apply extractMachineId middleware to all hardware routes
router.use(extractMachineId);

// POST /api/v1/hardware/door-state
router.post('/door-state', hardwareController.doorState.bind(hardwareController));

// GET /api/v1/hardware/sync
router.get('/sync', hardwareController.sync.bind(hardwareController));

module.exports = router;