import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '844dba0bfd8f3a4f3799f6130ef9e335',
    baseUrl: process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    timeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '5000', 10),
  },
  cache: {
    ttlSearch: parseInt(process.env.CACHE_TTL_SEARCH || '300', 10),
    ttlDetails: parseInt(process.env.CACHE_TTL_DETAILS || '3600', 10),
    ttlTrending: parseInt(process.env.CACHE_TTL_TRENDING || '600', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};
