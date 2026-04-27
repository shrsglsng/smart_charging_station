const express = require('express');
const router = express.Router();
const setupController = require('../controllers/setupController');

// POST /api/v1/setup/register
router.post('/register', setupController.registerStation.bind(setupController));

module.exports = router;
