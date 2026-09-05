import Movie from '../models/Movie.js';

const MOVIEBOX_BASE_URL = 'https://api.aoneroom.com';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';

let MOVIEBOX_SCRAPED_CACHE = [];
let LAST_MOVIEBOX_SYNC_TIME = null;
let IS_MOVIEBOX_SYNCING = false;

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) OkHttp/4.9.3',
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'x-tr-devtype': 'android',
  'x-tr-region': 'IN',
};

/**
 * Format raw MovieBox item into standard CineVault Movie schema
 */
export const formatMovieBoxItem = (item, customCategory = 'MovieBox VIP') => {
  const subjectId = String(item.subjectId || item.id || item.subject_id || Math.floor(Math.random() * 900000) + 100000);
  const title = item.title || item.subjectName || item.name || 'MovieBox Stream';
  const tmdbId = item.tmdbId || item.tmdb_id || subjectId;
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${subjectId}`;
  
  const coverUrl = item.cover?.url || item.coverUrl || item.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
  const backdropUrl = item.backdropUrl || coverUrl;

  const genres = item.genres || ['MovieBox VIP', customCategory, 'Action', 'Blockbuster'];

  return {
    _id: `mb_${subjectId}`,
    id: subjectId,
    subjectId,
    tmdbId,
    title,
    slug,
    description: item.description || item.subTitle || item.overview || `Watch ${title} in 1080p Full HD directly from MovieBox VIP high-speed servers.`,
    posterUrl: coverUrl,
    backdropUrl,
    trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`,
    releaseYear: parseInt(item.releaseYear || item.year || '2024', 10) || 2024,
    language: item.language || 'Hindi / Multi',
    genres: Array.from(new Set(genres)).filter(Boolean),
    duration: item.duration || '2h 10m',
    rating: typeof item.score === 'number' ? Number(item.score.toFixed(1)) : 8.6,
    director: item.director || 'MovieBox Cinema',
    cast: item.cast || ['Featured Cast'],
    type: item.category === 'tv' || item.type === 'tv' ? 'series' : 'movie',
    featured: true,
    trending: true,
    source: 'MovieBox',
    qualities: [
      { quality: '1080p', videoUrl: `https://player.videasy.net/movie/${tmdbId}?cdn=moviebox`, downloadUrl: `https://vidlink.pro/movie/${tmdbId}`, fileSize: '2.5 GB' },
      { quality: '720p', videoUrl: `https://player.videasy.net/movie/${tmdbId}?cdn=moviebox`, downloadUrl: `https://vidlink.pro/movie/${tmdbId}`, fileSize: '1.3 GB' },
      { quality: '480p', videoUrl: `https://peachify.top/embed/movie/${tmdbId}?dub=Hindi`, downloadUrl: `https://peachify.top/embed/movie/${tmdbId}?dub=Hindi`, fileSize: '650 MB' },
    ],
    videoUrl: `https://player.videasy.net/movie/${tmdbId}?cdn=moviebox`,
    downloadUrl: `https://vidlink.pro/movie/${tmdbId}`
  };
};

/**
 * Scrape Live MovieBox Search API by Keyword
 */
export const scrapeMovieBoxSearch = async (keyword, page = 1, size = 20) => {
  try {
    const params = new URLSearchParams({ keyword, page: String(page), size: String(size) });
    const response = await fetch(`${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/search?${params}`, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`MovieBox API error ${response.status}`);
    const data = await response.json();
    const items = data?.data?.list || data?.data?.items || [];
    const cleanItems = items.filter((item) => {
      if (!item) return false;
      if (item.is_ad || item.isAd || item.sponsored || item.advertisement || item.is_promotion) return false;
      const cat = String(item.category || item.type || '').toLowerCase();
      if (['ad', 'advertisement', 'promo', 'sponsored', 'sponsor'].includes(cat)) return false;
      return true;
    });
    return cleanItems.map(item => formatMovieBoxItem(item));
  } catch (error) {
    console.error(`MovieBox Scrape Error for key '${keyword}':`, error.message);
    return [];
  }
};

/**
 * Fetch Direct Stream Info for MovieBox Subject ID
 */
export const getMovieBoxStream = async (subjectId) => {
  try {
    const params = new URLSearchParams({ subjectId });
    const response = await fetch(`${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/play-info?${params}`, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`MovieBox PlayInfo error ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`MovieBox Stream Error for subjectId '${subjectId}':`, error.message);
    return null;
  }
};

/**
 * Scrape MovieBox Streams by TMDB ID
 */
export const getMovieBoxByTmdbId = async (tmdbId, mediaType = 'movie') => {
  try {
    // 1. Fetch TMDB title
    const tmdbRes = await fetch(`${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}`, {
      signal: AbortSignal.timeout(4000),
    });
    let title = 'Popular Movie';
    let tmdbData = null;
    if (tmdbRes.ok) {
      tmdbData = await tmdbRes.json();
      title = tmdbData.title || tmdbData.name || title;
    }

    // 2. Search MovieBox
    const searchItems = await scrapeMovieBoxSearch(title, 1, 10);
    let matchedItem = searchItems.length > 0 ? searchItems[0] : null;

    let streamData = null;
    if (matchedItem && matchedItem.subjectId) {
      streamData = await getMovieBoxStream(matchedItem.subjectId);
    }

    return {
      tmdbId,
      title,
      matchedItem,
      streams: streamData,
      tmdbData,
    };
  } catch (error) {
    console.error(`MovieBox TMDB Resolve Error for '${tmdbId}':`, error.message);
    return null;
  }
};

/**
 * ⚡ FULL AUTOMATIC MOVIEBOX CATALOG SCRAPER
 * Scrapes trending search keywords (Avatar, Marvel, Action, Hindi, Bollywood, Anime, Series)
 */
export const autoScrapeMovieBoxCatalog = async () => {
  if (IS_MOVIEBOX_SYNCING) {
    return { status: 'in_progress', message: 'MovieBox Sync already running' };
  }

  IS_MOVIEBOX_SYNCING = true;
  console.log('🎬 [MovieBox Scraper] Starting full catalog scrape...');

  const searchKeywords = ['Trending', 'Action', 'Hindi', 'Bollywood', 'Marvel', 'Avatar', 'Batman', 'Anime', 'Series'];

  try {
    const scrapedResults = await Promise.all(
      searchKeywords.map(kw => scrapeMovieBoxSearch(kw, 1, 15))
    );

    const combined = scrapedResults.flat();

    // Deduplicate by title/subjectId
    const uniqueMap = new Map();
    combined.forEach(item => {
      if (item.subjectId && !uniqueMap.has(item.subjectId)) {
        uniqueMap.set(item.subjectId, item);
      }
    });

    const uniqueList = Array.from(uniqueMap.values());
    MOVIEBOX_SCRAPED_CACHE = uniqueList;
    LAST_MOVIEBOX_SYNC_TIME = new Date().toISOString();

    console.log(`✅ [MovieBox Scraper] Scraped ${uniqueList.length} MovieBox titles successfully!`);

    // Sync to MongoDB if model is active
    for (const item of uniqueList) {
      try {
        await Movie.findOneAndUpdate(
          { subjectId: item.subjectId },
          { $set: item },
          { upsert: true, new: true }
        );
      } catch (e) {}
    }

    IS_MOVIEBOX_SYNCING = false;
    return {
      success: true,
      count: uniqueList.length,
      lastSync: LAST_MOVIEBOX_SYNC_TIME,
      data: uniqueList,
    };
  } catch (err) {
    console.error('❌ [MovieBox Scraper] Catalog scrape failed:', err.message);
    IS_MOVIEBOX_SYNCING = false;
    return { success: false, message: err.message };
  }
};

/**
 * Get cached MovieBox scraped catalog
 */
export const getMovieBoxCache = () => ({
  count: MOVIEBOX_SCRAPED_CACHE.length,
  lastSync: LAST_MOVIEBOX_SYNC_TIME,
  isSyncing: IS_MOVIEBOX_SYNCING,
  movies: MOVIEBOX_SCRAPED_CACHE,
});

/**
 * Initialize automatic periodic MovieBox background sync (Every 4 hours)
 */
export const initMovieBoxScraperSchedule = () => {
  setTimeout(() => {
    autoScrapeMovieBoxCatalog();
  }, 2000);

  setInterval(() => {
    console.log('⏰ [MovieBox Scraper] Running scheduled 4-hour automatic catalog refresh...');
    autoScrapeMovieBoxCatalog();
  }, 4 * 60 * 60 * 1000);
};
