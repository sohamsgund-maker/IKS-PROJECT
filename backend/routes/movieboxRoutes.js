import { Router } from 'express';

const router = Router();
const MOVIEBOX_BASE = 'https://api.aoneroom.com';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const DEFAULT_TMDB_API_KEY = process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) OkHttp/4.9.3',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-tr-devtype': 'android',
  'x-tr-region': 'IN',
};

// 1. Search Route: GET /api/moviebox/search?q=Avatar
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, size = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

    const params = new URLSearchParams({ keyword: String(q), page: String(page), size: String(size) });
    const response = await fetch(`${MOVIEBOX_BASE}/wefeed-mobile-bff/subject-api/search?${params}`, {
      headers: defaultHeaders,
    });
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Stream Route: GET /api/moviebox/stream/:subjectId
router.get('/stream/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;
    const params = new URLSearchParams({ subjectId });
    const response = await fetch(`${MOVIEBOX_BASE}/wefeed-mobile-bff/subject-api/play-info?${params}`, {
      headers: defaultHeaders,
    });
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 3. TMDB Resolution Route: GET /api/moviebox/tmdb/:tmdbId
router.get('/tmdb/:tmdbId', async (req, res) => {
  try {
    const { tmdbId } = req.params;
    const mediaType = req.query.type || 'movie';

    // A. Query TMDB API
    const tmdbRes = await fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${DEFAULT_TMDB_API_KEY}`);
    if (!tmdbRes.ok) return res.status(404).json({ error: 'TMDB Movie not found' });
    const tmdbData = await tmdbRes.json();
    const title = tmdbData.title || tmdbData.name;

    // B. Search MovieBox
    const searchParams = new URLSearchParams({ keyword: title, page: '1', size: '10' });
    const searchRes = await fetch(`${MOVIEBOX_BASE}/wefeed-mobile-bff/subject-api/search?${searchParams}`, {
      headers: defaultHeaders,
    });
    const searchData = await searchRes.json();

    // C. Get Streams if items exist
    const items = searchData?.data?.list || searchData?.data?.items || [];
    let streamData = null;
    let subjectId = null;
    if (items.length > 0) {
      subjectId = items[0].subjectId || items[0].id;
      const streamRes = await fetch(`${MOVIEBOX_BASE}/wefeed-mobile-bff/subject-api/play-info?subjectId=${subjectId}`, {
        headers: defaultHeaders,
      });
      streamData = await streamRes.json();
    }

    return res.json({
      tmdbId,
      title,
      subjectId,
      tmdbData,
      movieboxSearch: searchData,
      streams: streamData,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
