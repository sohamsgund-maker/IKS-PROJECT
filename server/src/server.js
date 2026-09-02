import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`🚀 Movie Metadata REST API Service running on port ${config.port} [${config.env}]`);
  logger.info(`📡 Health Endpoint: http://localhost:${config.port}/api/v1/health`);
  logger.info(`🔍 Search Endpoint: http://localhost:${config.port}/api/v1/movies/search?q=Inception`);
});

// Graceful Shutdown on termination signals
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
