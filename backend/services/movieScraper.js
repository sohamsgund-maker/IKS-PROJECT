import Movie from '../models/Movie.js';

// Free TMDB Public API Endpoint & Key Fallback
const TMDB_API_KEY = process.env.TMDB_API_KEY || '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

// In-Memory fallback cache for scraped movies
let SCRAPED_MOVIES_CACHE = [];
let LAST_SYNC_TIME = null;
let IS_SYNCING = false;

/**
 * Format raw TMDB movie/TV object into CineVault Movie schema
 */
export const formatTMDBItem = (item, type = 'movie', customCategory = '') => {
  const isMovie = type === 'movie' || !item.first_air_date;
  const title = item.title || item.name || 'Untitled';
  const releaseDate = item.release_date || item.first_air_date || '2024-01-01';
  const releaseYear = parseInt(releaseDate.substring(0, 4), 10) || 2024;
  const tmdbId = item.id;
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${tmdbId}`;

  // Extract genres
  let genres = item.genres 
    ? item.genres.map(g => g.name) 
    : (item.genre_ids ? ['Action', 'Drama', 'Adventure'] : ['Entertainment']);

  if (customCategory && !genres.includes(customCategory)) {
    genres = [customCategory, ...genres];
  }

  // Language mapper
  let language = 'English';
  if (item.original_language === 'hi') {
    language = 'Hindi (Bollywood)';
    if (!genres.includes('Bollywood')) genres.push('Bollywood');
  } else if (item.original_language === 'te') {
    language = 'Telugu (South)';
    if (!genres.includes('South Indian')) genres.push('South Indian');
  } else if (item.original_language === 'ta') {
    language = 'Tamil (South)';
    if (!genres.includes('South Indian')) genres.push('South Indian');
  } else if (item.original_language === 'kn') {
    language = 'Kannada (South)';
    if (!genres.includes('South Indian')) genres.push('South Indian');
  } else if (item.original_language === 'ml') {
    language = 'Malayalam (South)';
    if (!genres.includes('South Indian')) genres.push('South Indian');
  } else if (item.original_language === 'ja') {
    language = 'Japanese (Anime)';
    if (!genres.includes('Anime')) genres.push('Anime');
  } else if (item.original_language === 'en') {
    language = 'English (Hollywood)';
    if (!genres.includes('Hollywood')) genres.push('Hollywood');
  }

  let cast = [];
  let director = '';
  if (item.credits) {
    if (item.credits.cast) {
      cast = item.credits.cast.slice(0, 5).map(c => c.name);
    }
    if (item.credits.crew) {
      const dirObj = item.credits.crew.find(c => c.job === 'Director');
      if (dirObj) director = dirObj.name;
    }
  }

  let trailerUrl = '';
  if (item.videos && item.videos.results) {
    const trailer = item.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
    if (trailer) {
      trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }

  const posterUrl = item.poster_path 
    ? `${TMDB_IMG_BASE}/w780${item.poster_path}` 
    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';

  const backdropUrl = item.backdrop_path 
    ? `${TMDB_IMG_BASE}/original${item.backdrop_path}` 
    : posterUrl;

  const duration = isMovie 
    ? (item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '2h 15m')
    : `${item.number_of_seasons || 1} Season${(item.number_of_seasons || 1) > 1 ? 's' : ''}`;

  return {
    _id: String(tmdbId),
    id: String(tmdbId),
    tmdbId,
    title,
    slug,
    description: item.overview || 'Stream and download in 1080p Full HD with dual-audio and subtitles.',
    posterUrl,
    backdropUrl,
    trailerUrl,
    releaseYear,
    language,
    genres: genres.length > 0 ? genres : ['Action', 'Drama'],
    duration,
    rating: Number((item.vote_average || 8.2).toFixed(1)),
    director: director || 'Popular Director',
    cast: cast.length > 0 ? cast : ['Leading Cast'],
    type: isMovie ? 'movie' : 'series',
    featured: item.popularity > 150,
    trending: true,
    qualities: [
      { quality: '1080p', videoUrl: `https://www.2embed.cc/${isMovie ? 'embed' : 'embedtv'}/${tmdbId}`, downloadUrl: `https://www.2embed.cc/${isMovie ? 'embed' : 'embedtv'}/${tmdbId}`, fileSize: '2.4 GB' },
      { quality: '720p', videoUrl: `https://peachify.top/embed/${isMovie ? 'movie' : 'tv'}/${tmdbId}?dub=Hindi`, downloadUrl: `https://peachify.top/embed/${isMovie ? 'movie' : 'tv'}/${tmdbId}?dub=Hindi`, fileSize: '1.2 GB' },
      { quality: '480p', videoUrl: `https://peachify.top/embed/${isMovie ? 'movie' : 'tv'}/${tmdbId}?dub=Hindi`, downloadUrl: `https://peachify.top/embed/${isMovie ? 'movie' : 'tv'}/${tmdbId}?dub=Hindi`, fileSize: '650 MB' }
    ],
    videoUrl: `https://www.2embed.cc/${isMovie ? 'embed' : 'embedtv'}/${tmdbId}`,
    downloadUrl: `https://www.2embed.cc/${isMovie ? 'embed' : 'embedtv'}/${tmdbId}`
  };
};

/**
 * Fetch and Scrape Movie Details by TMDB ID
 */
export const fetchMovieByTmdbId = async (id, type = 'movie') => {
  try {
    const endpoint = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,similar`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return formatTMDBItem(data, type);
  } catch (error) {
    console.error(`Error fetching TMDB ID ${id}:`, error.message);
    return {
      _id: String(id),
      id: String(id),
      tmdbId: id,
      title: `Movie (${id})`,
      slug: `movie-${id}`,
      description: 'Stream instantly across all fast servers in 1080p Full HD with subtitle & dual audio support.',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      trailerUrl: '',
      releaseYear: 2024,
      language: 'Hindi / English',
      genres: ['Action', 'Sci-Fi', 'Blockbuster'],
      duration: '2h 15m',
      rating: 8.5,
      director: 'Cinema Studio',
      cast: ['Featured Cast'],
      type: type === 'tv' ? 'series' : 'movie',
      qualities: [
        { quality: '1080p', videoUrl: `https://www.2embed.cc/${type === 'tv' ? 'embedtv' : 'embed'}/${id}`, fileSize: '2.4 GB' },
        { quality: '720p', videoUrl: `https://peachify.top/embed/${type === 'tv' ? 'tv' : 'movie'}/${id}?dub=Hindi`, fileSize: '1.2 GB' },
        { quality: '480p', videoUrl: `https://peachify.top/embed/${type === 'tv' ? 'tv' : 'movie'}/${id}?dub=Hindi`, fileSize: '650 MB' }
      ],
      videoUrl: `https://www.2embed.cc/${type === 'tv' ? 'embedtv' : 'embed'}/${id}`,
      downloadUrl: `https://www.2embed.cc/${type === 'tv' ? 'embedtv' : 'embed'}/${id}`
    };
  }
};

/**
 * Scrape Bollywood Movies (Hindi)
 */
export const scrapeBollywood = async (page = 1) => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=${page}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(item => formatTMDBItem(item, 'movie', 'Bollywood'));
  } catch (err) {
    console.error('Bollywood scrape error:', err.message);
    return [];
  }
};

/**
 * Scrape South Indian Movies (Telugu, Tamil, Malayalam, Kannada)
 */
export const scrapeSouthIndian = async (page = 1) => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=te|ta|ml|kn&sort_by=popularity.desc&page=${page}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(item => formatTMDBItem(item, 'movie', 'South Indian'));
  } catch (err) {
    console.error('South Indian scrape error:', err.message);
    return [];
  }
};

/**
 * Scrape Hollywood Movies
 */
export const scrapeHollywood = async (page = 1) => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=en&sort_by=popularity.desc&page=${page}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(item => formatTMDBItem(item, 'movie', 'Hollywood'));
  } catch (err) {
    console.error('Hollywood scrape error:', err.message);
    return [];
  }
};

/**
 * Scrape Trending Anime & Series
 */
export const scrapeAnime = async (page = 1) => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ja&with_genres=16&sort_by=popularity.desc&page=${page}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(item => formatTMDBItem(item, 'series', 'Anime'));
  } catch (err) {
    console.error('Anime scrape error:', err.message);
    return [];
  }
};

/**
 * Scrape Trending All
 */
export const scrapeAndSyncTrending = async () => {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(item => formatTMDBItem(item, item.media_type || 'movie'));
  } catch (err) {
    console.error('Trending sync error:', err.message);
    return [];
  }
};

/**
 * ⚡ FULL AUTOMATIC CATALOG SCRAPER (Runs on background timer & on-demand)
 */
export const autoScrapeAll = async () => {
  if (IS_SYNCING) {
    return { status: 'in_progress', message: 'Sync already running' };
  }

  IS_SYNCING = true;
  console.log('🔄 [AutoScraper] Starting automatic full movie catalog scrape...');

  try {
    const [bollywood1, bollywood2, south1, south2, hollywood1, hollywood2, trending, anime] = await Promise.all([
      scrapeBollywood(1),
      scrapeBollywood(2),
      scrapeSouthIndian(1),
      scrapeSouthIndian(2),
      scrapeHollywood(1),
      scrapeHollywood(2),
      scrapeAndSyncTrending(),
      scrapeAnime(1)
    ]);

    const combined = [
      ...bollywood1,
      ...bollywood2,
      ...south1,
      ...south2,
      ...hollywood1,
      ...hollywood2,
      ...trending,
      ...anime
    ];

    // Deduplicate by TMDB ID
    const uniqueMap = new Map();
    combined.forEach(m => {
      if (m.tmdbId && !uniqueMap.has(m.tmdbId)) {
        uniqueMap.set(m.tmdbId, m);
      }
    });

    const uniqueList = Array.from(uniqueMap.values());
    SCRAPED_MOVIES_CACHE = uniqueList;
    LAST_SYNC_TIME = new Date().toISOString();

    console.log(`✅ [AutoScraper] Auto-scraped ${uniqueList.length} movies across Bollywood, South Indian, Hollywood & Anime!`);

    // Upsert into MongoDB if connected
    for (const m of uniqueList) {
      try {
        await Movie.findOneAndUpdate(
          { tmdbId: m.tmdbId },
          { $set: m },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        // Continue if local DB is offline
      }
    }

    IS_SYNCING = false;
    return {
      success: true,
      count: uniqueList.length,
      lastSync: LAST_SYNC_TIME,
      data: uniqueList
    };
  } catch (err) {
    console.error('❌ [AutoScraper] Error during full auto-scrape:', err.message);
    IS_SYNCING = false;
    return { success: false, message: err.message };
  }
};

/**
 * Get current cached scraped movies
 */
export const getScrapedCache = () => ({
  count: SCRAPED_MOVIES_CACHE.length,
  lastSync: LAST_SYNC_TIME,
  isSyncing: IS_SYNCING,
  movies: SCRAPED_MOVIES_CACHE
});

/**
 * Initialize automatic periodic scraping cron (every 6 hours)
 */
export const initAutoScraperSchedule = () => {
  // Trigger initial scrape after 3 seconds of server boot
  setTimeout(() => {
    autoScrapeAll();
  }, 3000);

  // Periodic automatic sync every 6 hours (6 * 60 * 60 * 1000 ms)
  setInterval(() => {
    console.log('⏰ [AutoScraper] Running scheduled 6-hour automatic catalog refresh...');
    autoScrapeAll();
  }, 6 * 60 * 60 * 1000);
};

export const extractIdFromUrl = (urlOrId) => {
  if (!urlOrId) return null;
  const str = String(urlOrId).trim();
  
  if (/^\d+$/.test(str)) {
    return { id: str, type: 'movie' };
  }

  const match = str.match(/(?:netplay-one\.vercel\.app|cinevault|themoviedb\.org)\/(?:watch\/)?(movie|tv)\/(\d+)/i);
  if (match) {
    return { type: match[1] === 'tv' ? 'tv' : 'movie', id: match[2] };
  }

  const anyIdMatch = str.match(/(?:movie|tv|film|title)\/(\d+)/i);
  if (anyIdMatch) {
    return { type: 'movie', id: anyIdMatch[1] };
  }

  return null;
};
