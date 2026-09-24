import { Router } from 'express';
import movieRoutes from './movie.routes.js';
import healthRoutes from './health.routes.js';
import scraperRoutes from './scraper.routes.js';
import { MovieController } from '../controllers/movie.controller.js';
import { ScraperController } from '../controllers/scraper.controller.js';

const router = Router();

// 1:1 ADSTUDIO MovieBox API Endpoints
router.get('/home', MovieController.getMovieboxHome);
router.get('/trending', MovieController.getMovieboxTrending);
router.get('/search', MovieController.searchMoviebox);
router.get('/suggestions', MovieController.getMovieboxSuggestions);
router.get('/details', MovieController.getMovieboxDetails);
router.get('/streams', MovieController.getMovieboxStreams);

// Automated Scraper Endpoints
router.use('/scraper', scraperRoutes);
router.get('/catalog/auto', ScraperController.getCatalog);

router.use('/movies', movieRoutes);
router.use('/health', healthRoutes);

export default router;

