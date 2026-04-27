const extractMachineId = (req, res, next) => {
  const machineId = req.headers['x-machine-id'];
  if (!machineId) {
    return res.status(400).json({
      error: 'Missing required header: x-machine-id'
    });
  }
  req.machineId = machineId;
  next();
};

module.exports = extractMachineId;