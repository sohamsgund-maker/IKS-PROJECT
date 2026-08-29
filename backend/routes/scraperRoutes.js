import express from 'express';
import { 
  fetchMovieByTmdbId, 
  extractIdFromUrl, 
  scrapeAndSyncTrending,
  scrapeBollywood,
  scrapeSouthIndian,
  scrapeHollywood,
  scrapeAnime,
  autoScrapeAll,
  getScrapedCache
} from '../services/movieScraper.js';

const router = express.Router();

// ⚡ Trigger Full Automatic Scraping of all categories
router.get('/sync-all', async (req, res) => {
  try {
    const result = await autoScrapeAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check auto-scraper status and get cached scraped movies
router.get('/status', (req, res) => {
  const cache = getScrapedCache();
  res.json({ success: true, ...cache });
});

// Scrape Bollywood movies (Hindi)
router.get('/bollywood', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await scrapeBollywood(page);
    res.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scrape South Indian movies (Telugu, Tamil, Malayalam, Kannada)
router.get('/south-indian', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await scrapeSouthIndian(page);
    res.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scrape Hollywood movies
router.get('/hollywood', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await scrapeHollywood(page);
    res.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scrape Anime
router.get('/anime', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const movies = await scrapeAnime(page);
    res.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Scrape Trending
router.get('/scrape-trending', async (req, res) => {
  try {
    const movies = await scrapeAndSyncTrending();
    res.json({ success: true, count: movies.length, data: movies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch movie by TMDB ID
router.get('/fetch-by-id/:id', async (req, res) => {
  try {
    const type = req.query.type || 'movie';
    const movie = await fetchMovieByTmdbId(req.params.id, type);
    res.json({ success: true, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Import movie from any URL or ID
router.post('/import-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL or TMDB ID is required' });
    }

    const parsed = extractIdFromUrl(url);
    if (!parsed) {
      return res.status(400).json({ success: false, message: 'Invalid Movie URL or ID format' });
    }

    const movie = await fetchMovieByTmdbId(parsed.id, parsed.type);
    res.json({ success: true, parsed, data: movie });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔎 Fast In-Memory Search over the 35,000+ Indexed TMDB Movies Export
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexedDataPath = path.join(__dirname, '..', 'data', 'indexed_tmdb_movies.json');

let INDEXED_TMDB_DATA = null;

const loadIndexedData = () => {
  if (!INDEXED_TMDB_DATA && fs.existsSync(indexedDataPath)) {
    try {
      const raw = fs.readFileSync(indexedDataPath, 'utf-8');
      INDEXED_TMDB_DATA = JSON.parse(raw);
    } catch (e) {
      INDEXED_TMDB_DATA = [];
    }
  }
  return INDEXED_TMDB_DATA || [];
};

router.get('/tmdb-index-search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (!q) return res.json({ success: true, count: 0, data: [] });

    const dataset = loadIndexedData();
    const matches = dataset
      .filter(item => item.title && (item.title.toLowerCase().includes(q) || String(item.id) === q))
      .slice(0, 20);

    // Enrich top 5 matches with full TMDB metadata
    const enriched = await Promise.all(
      matches.slice(0, 6).map(async (m) => {
        try {
          return await fetchMovieByTmdbId(m.id, 'movie');
        } catch {
          return {
            id: String(m.id),
            tmdbId: m.id,
            title: m.title,
            popularity: m.popularity
          };
        }
      })
    );

    res.json({
      success: true,
      count: enriched.length,
      totalMatches: matches.length,
      data: enriched
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
