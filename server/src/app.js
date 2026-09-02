import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ApiError } from './utils/apiError.js';

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured Request Logging
app.use(requestLogger);

// Global Rate Limiting
app.use('/api', apiRateLimiter);

// API v1 Routing
app.use('/api/v1', routes);

// 404 Route Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
