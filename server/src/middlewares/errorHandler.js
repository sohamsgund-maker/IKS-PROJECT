import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  logger.error('Unhandled Application Error', {
    message: err.message,
    statusCode,
    errorCode,
    stack: config.env === 'development' ? err.stack : undefined,
    url: req.originalUrl,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An unexpected error occurred',
      statusCode,
      ...(err.details ? { details: err.details } : {}),
      ...(config.env === 'development' ? { stack: err.stack } : {}),
    },
  });
};
