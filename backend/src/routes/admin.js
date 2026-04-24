const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/v1/admin/stats
router.get('/stats', adminController.getStats.bind(adminController));

// GET /api/v1/admin/machines
router.get('/machines', adminController.getAllMachines.bind(adminController));

// POST /api/v1/admin/machines
router.post('/machines', adminController.createMachine.bind(adminController));

// GET /api/v1/admin/history
router.get('/history', adminController.getHistory.bind(adminController));

// PUT /api/v1/admin/machines/:machine_id
router.put('/machines/:machine_id', adminController.updateMachine.bind(adminController));

// POST /api/v1/admin/sessions/:id/reset
router.post('/sessions/:id/reset', adminController.resetSession.bind(adminController));

module.exports = router;
