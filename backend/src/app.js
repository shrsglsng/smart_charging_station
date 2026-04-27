const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
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

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for Admin Web App
const adminPath = path.resolve(__dirname, '..', 'public', 'admin');
app.use('/admin', express.static(adminPath));

// API routes - all under /api/v1
app.use('/api/v1', apiRoutes);

// Fallback for Admin SPA (Single Page Application)
// Using (.*) for maximum compatibility with all path-to-regexp versions
app.get('/admin(.*)', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Global error handler
app.use(errorHandler);

module.exports = app;