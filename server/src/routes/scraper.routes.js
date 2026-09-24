import { Router } from 'express';
import { ScraperController } from '../controllers/scraper.controller.js';

const router = Router();

// GET /api/v1/scraper/status
router.get('/status', ScraperController.getStatus);

// POST /api/v1/scraper/trigger
router.post('/trigger', ScraperController.triggerScrape);

// GET /api/v1/scraper/catalog
router.get('/catalog', ScraperController.getCatalog);

// GET /api/v1/scraper/item/:id
router.get('/item/:id', ScraperController.getItem);

export default router;
