const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const extractMachineId = require('./middleware/extractMachineId');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');
const apiRoutes = require('./routes');
const logger = require('./logger/logger');

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Security middleware
app.use(helmet());
app.use(cors());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Sensitive Auth Rate Limiting (Kiosk Spam & Brute-force protection)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  message: { error: 'Too many verification attempts. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/session/retrieve', authLimiter);
app.use('/api/v1/session/recover-unlock', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Serve static files for Admin Web App
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// API routes - all under /api/v1
app.use('/api/v1', apiRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;