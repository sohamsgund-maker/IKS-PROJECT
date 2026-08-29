import express from 'express';
import { getMovies, getMovieBySlug, getTrendingMovies, getLatestMovies, getMoviesByGenre, searchMovies } from '../controllers/movieController.js';

const router = express.Router();

router.get('/', getMovies);
router.get('/trending', getTrendingMovies);
router.get('/latest', getLatestMovies);
router.get('/genre/:genre', getMoviesByGenre);
router.get('/search', searchMovies);
router.get('/:slug', getMovieBySlug);

export default router;
