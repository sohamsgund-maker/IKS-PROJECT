import { AutoScraperService } from '../services/autoScraper.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class ScraperController {
  /**
   * GET /api/v1/scraper/status
   * Monitor live scraper status, statistics, and run times
   */
  static getStatus(req, res) {
    const scraper = AutoScraperService.getInstance();
    return ApiResponse.success(res, scraper.getStatus());
  }

  /**
   * POST /api/v1/scraper/trigger
   * Manually trigger a background metadata scrape cycle
   */
  static triggerScrape(req, res, next) {
    try {
      const scraper = AutoScraperService.getInstance();
      const force = req.query.force === 'true' || req.body?.force === true;

      // Launch cycle in background non-blockingly
      scraper.startScrapeCycle({ force }).catch((err) => {
        // logged internally by service
      });

      return ApiResponse.success(res, {
        message: 'Automated metadata scrape cycle initiated in the background.',
        status: scraper.status,
        checkStatusUrl: '/api/v1/scraper/status',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scraper/catalog
   * Retrieve pre-scraped full catalog with shelves
   */
  static getCatalog(req, res, next) {
    try {
      const { type = 'all', genre = '' } = req.query;
      const scraper = AutoScraperService.getInstance();
      const data = scraper.getCatalog({ type, genre });
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/scraper/item/:id
   * Retrieve single pre-scraped title with complete metadata
   */
  static getItem(req, res, next) {
    try {
      const { id } = req.params;
      const scraper = AutoScraperService.getInstance();
      const item = scraper.getItemById(id);

      if (!item) {
        throw ApiError.notFound(`Title #${id} not found in pre-scraped metadata store.`);
      }

      return ApiResponse.success(res, item);
    } catch (error) {
      next(error);
    }
  }
}
