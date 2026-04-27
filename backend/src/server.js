require('dotenv').config(); // MUST BE AT THE VERY TOP
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./logger/logger');
require('./jobs/timerJob')

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Connect to MongoDB first, THEN start listening
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB Atlas successfully.');
    server.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Database connection failed:', err);
    process.exit(1); // Stop the app if DB fails
  });

module.exports = server;