const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');
const extractMachineId = require('../middleware/extractMachineId');

// POST /api/v1/setup/register
router.post('/register', extractMachineId, setupController.registerStation.bind(setupController));

module.exports = router;
