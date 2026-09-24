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

// GET /api/v1/movies/languages
router.get('/languages', MovieController.getLanguages);

// GET /api/v1/movies/moviebox/home
router.get('/moviebox/home', cacheMiddleware(300), MovieController.getMovieboxHome);

// GET /api/v1/movies/moviebox/search?q={query}&page={page}
router.get('/moviebox/search', cacheMiddleware(180), MovieController.searchMoviebox);

// GET /api/v1/movies/moviebox/trending?type={type}&page={page}
router.get('/moviebox/trending', cacheMiddleware(300), MovieController.getMovieboxTrending);

// GET /api/v1/movies/moviebox/streams?id={id}&type={type}&season={s}&episode={e}
router.get('/moviebox/streams', cacheMiddleware(300), MovieController.getMovieboxStreams);

// GET /api/v1/movies/moviebox/suggestions?q={query}
router.get('/moviebox/suggestions', cacheMiddleware(300), MovieController.getMovieboxSuggestions);

// GET /api/v1/movies/:id
router.get('/:id', validateMovieId, cacheMiddleware(config.cache.ttlDetails), MovieController.getById);

// GET /api/v1/movies/:id/streams
router.get('/:id/streams', validateMovieId, cacheMiddleware(300), MovieController.getStreams);

export default router;

