import { Router } from 'express';
import {
  autoScrapeMovieBoxCatalog,
  getMovieBoxCache,
  scrapeMovieBoxSearch,
  getMovieBoxStream,
  getMovieBoxByTmdbId,
} from '../services/movieboxScraper.js';

const router = Router();

// 1. Get Cached Scraped MovieBox Catalog
router.get('/catalog', (req, res) => {
  const cache = getMovieBoxCache();
  res.json({ success: true, ...cache });
});

// 2. Trigger Full MovieBox Catalog Scrape & Sync
router.get('/sync', async (req, res) => {
  try {
    const result = await autoScrapeMovieBoxCatalog();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Search Route: GET /api/moviebox/search?q=Avatar
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, size = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

    const movies = await scrapeMovieBoxSearch(q, page, size);
    return res.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 4. Stream Route: GET /api/moviebox/stream/:subjectId
router.get('/stream/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const streamData = await getMovieBoxStream(subjectId);
    return res.json({ success: true, subjectId, data: streamData });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 5. TMDB Resolution Route: GET /api/moviebox/tmdb/:tmdbId
router.get('/tmdb/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const mediaType = req.query.type || 'movie';

    const result = await getMovieBoxByTmdbId(tmdbId, mediaType);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
