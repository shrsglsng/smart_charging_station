const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define transports
const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        ({ timestamp, level, message, ...meta }) => {
          const msg = `${timestamp} [${level}]: ${message}`;
          return Object.keys(meta).length ? `${msg} ${JSON.stringify(meta)}` : msg;
        }
      )
    ),
  }),
  new winston.transports.File({ 
    filename: path.join(__dirname, '..', '..', 'logs', 'error.log'),
    level: 'error',
    format: logFormat
  }),
  new winston.transports.File({ 
    filename: path.join(__dirname, '..', '..', 'logs', 'combined.log'),
    format: logFormat
  })
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports,
  exitOnError: false, // Do not exit on handled exceptions
});

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

module.exports = logger;