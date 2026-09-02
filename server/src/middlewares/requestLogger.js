import morgan from 'morgan';
import { logger } from '../utils/logger.js';

export const requestLogger = morgan((tokens, req, res) => {
  const status = Number(tokens.status(req, res));
  const logData = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status,
    responseTimeMs: parseFloat(tokens['response-time'](req, res)),
    ip: req.ip,
  };

  if (status >= 400) {
    logger.warn('Incoming Request Error', logData);
  } else {
    logger.info('Incoming Request Completed', logData);
  }
  return null;
});
