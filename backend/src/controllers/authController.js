const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger/logger');

class AuthController {
  // POST /api/v1/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        logger.warn(`Auth failed: Email ${email} not found`);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn(`Auth failed: Incorrect password for ${email}`);
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      // Sign JWT
      const jwtSecret = process.env.JWT_SECRET || 'aibotink_secret_key_123';
      const token = jwt.sign(
        { id: user._id, email: user.email },
        jwtSecret,
        { expiresIn: '24h' }
      );

      logger.info(`Auth success: Admin ${user.email} logged in`);
      res.json({
        success: true,
        token,
        email: user.email
      });
    } catch (error) {
      logger.error('Error during login:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();
