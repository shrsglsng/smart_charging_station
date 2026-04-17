const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const extractMachineId = require('./middleware/extractMachineId');
const errorHandler = require('./middleware/errorHandler');
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

// Global middleware to extract machine ID
app.use(extractMachineId);

// API routes - all under /api/v1
app.use('/api/v1', apiRoutes);

// Global error handler
app.use(errorHandler);

module.exports = app;