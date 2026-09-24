import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { AutoScraperService } from './services/autoScraper.service.js';

const autoScraper = AutoScraperService.getInstance();

const server = app.listen(config.port, async () => {
  logger.info(`🚀 Movie Metadata REST API Service running on port ${config.port} [${config.env}]`);
  logger.info(`📡 Health Endpoint: http://localhost:${config.port}/api/v1/health`);
  logger.info(`🔍 Search Endpoint: http://localhost:${config.port}/api/v1/movies/search?q=Inception`);
  logger.info(`🤖 AutoScraper Status: http://localhost:${config.port}/api/v1/scraper/status`);
  logger.info(`📚 Pre-scraped Catalog: http://localhost:${config.port}/api/v1/scraper/catalog`);

  // Initialize automated background metadata scraper
  await autoScraper.init();
});

// Graceful Shutdown on termination signals
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  autoScraper.stop();
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process-level safety net: prevent unhandled stream errors or timeouts from terminating the daemon
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', { reason });
});
