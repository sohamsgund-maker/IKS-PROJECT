import { Router } from 'express';
import { MovieController } from '../controllers/movie.controller.js';
import { validateSearchQuery, validateMovieId } from '../middlewares/validate.js';
import { cacheMiddleware } from '../middlewares/cache.js';
import { config } from '../config/env.js';

const router = Router();

// GET /api/v1/movies/search?q={query}&page={page}
router.get('/search', validateSearchQuery, cacheMiddleware(config.cache.ttlSearch), MovieController.search);

// GET /api/v1/movies/trending?page={page}
router.get('/trending', cacheMiddleware(config.cache.ttlTrending), MovieController.getTrending);

// GET /api/v1/movies/:id
router.get('/:id', validateMovieId, cacheMiddleware(config.cache.ttlDetails), MovieController.getById);

// GET /api/v1/movies/:id/streams
router.get('/:id/streams', validateMovieId, cacheMiddleware(300), MovieController.getStreams);

export default router;
