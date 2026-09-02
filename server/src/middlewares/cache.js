import NodeCache from 'node-cache';
import { ApiResponse } from '../utils/apiResponse.js';

export const cacheStore = new NodeCache({ checkperiod: 120 });

export const cacheMiddleware = (ttlSeconds) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = req.originalUrl || req.url;
    const cachedData = cacheStore.get(cacheKey);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return ApiResponse.success(res, cachedData.data, {
        pagination: cachedData.pagination,
        meta: { cached: true, cacheTtlSeconds: ttlSeconds },
      });
    }

    res.setHeader('X-Cache', 'MISS');

    // Override res.json to capture response in cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200 && body && body.success) {
        cacheStore.set(cacheKey, { data: body.data, pagination: body.pagination }, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};
