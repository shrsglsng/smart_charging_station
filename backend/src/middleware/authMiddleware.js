const jwt = require('jsonwebtoken');
const logger = require('../logger/logger');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn(`Auth blocked: Missing or malformed Authorization header`);
      return res.status(401).json({ success: false, message: 'Access denied. Unauthorized request.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'aibotink_secret_key_123';

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      next();
    } catch (err) {
      logger.warn(`Auth blocked: Invalid token passed`);
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
    }
  } catch (error) {
    logger.error('Error in auth middleware:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = authMiddleware;
