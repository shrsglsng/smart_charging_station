const Machine = require('../models/Machine');
const bcrypt = require('bcryptjs');
const logger = require('../logger/logger');

const extractMachineId = async (req, res, next) => {
  const machineId = req.headers['x-machine-id'];
  const machinePassword = req.headers['x-machine-password'];

  if (!machineId) {
    logger.warn(`Hardware request blocked: Missing x-machine-id header`);
    return res.status(400).json({
      error: 'Missing required header: x-machine-id'
    });
  }

  if (!machinePassword) {
    logger.warn(`Hardware request blocked: Missing x-machine-password header for machine ${machineId}`);
    return res.status(401).json({
      error: 'Missing required header: x-machine-password'
    });
  }

  try {
    const upperMachineId = machineId.toUpperCase();
    const machine = await Machine.findOne({ machine_id: upperMachineId });

    if (!machine) {
      logger.warn(`Hardware auth failed: Machine ID ${upperMachineId} is not registered`);
      return res.status(401).json({
        error: 'Machine is not registered or credentials invalid'
      });
    }

    const isMatch = await bcrypt.compare(machinePassword, machine.password);
    if (!isMatch) {
      logger.warn(`Hardware auth failed: Incorrect password provided for machine ${upperMachineId}`);
      return res.status(401).json({
        error: 'Machine is not registered or credentials invalid'
      });
    }

    req.machineId = upperMachineId;
    next();
  } catch (error) {
    logger.error('Error in extractMachineId middleware:', error);
    return res.status(500).json({ error: 'Internal server error during machine authentication' });
  }
};

module.exports = extractMachineId;