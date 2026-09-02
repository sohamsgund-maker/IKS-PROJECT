import { cacheStore } from '../middlewares/cache.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class HealthController {
  static getHealth(req, res) {
    const stats = cacheStore.getStats();

    return ApiResponse.success(res, {
      status: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      cache: {
        keys: cacheStore.keys().length,
        hits: stats.hits,
        misses: stats.misses,
        ksize: stats.ksize,
        vsize: stats.vsize,
      },
    });
  }
}
