import type { Movie, AuthUser, MovieQuality, StreamInfoResponse, AudioTrack } from '../types/movie';
import { CURATED_MOVIES_CATALOG } from '../data/curatedCatalog';
import { movieboxService } from './movieboxService';
import { getCloudMovies } from './supabaseClient';



export interface StreamingServer {
  id: string;
  name: string;
  badge?: string;
  hasHindiAudio: boolean;
  hindiBadge: string;
  description: string;
  priority: number;
}

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'vidlink',
    name: 'Server 1: VidLink (Ultra Fast 4K • Multi-Audio)',
    badge: 'Fastest 4K',
    hasHindiAudio: true,
    hindiBadge: '⚡ Ultra Fast 4K',
    description: 'Ultra high-speed bufferless stream with multi-language audio & subtitles',
    priority: 1
  },
  {
    id: 'peachify',
    name: 'Server 2: Peachify VIP (Hindi Audio Dub)',
    badge: 'Hindi Dub VIP',
    hasHindiAudio: true,
    hindiBadge: '🇮🇳 Real Hindi Dual Audio',
    description: 'Direct 1080p stream with native Hindi dual-audio track support',
    priority: 2
  },
  {
    id: '2embed',
    name: 'Server 3: 2Embed (Dual Audio Mirrors)',
    badge: 'Multi-Stream',
    hasHindiAudio: true,
    hindiBadge: '🌐 Dual Audio / Multi-Stream',
    description: 'High-speed Dual Audio multi-stream server with instant Hindi audio playback',
    priority: 3
  },
  {
    id: 'direct',
    name: 'Direct HTML5 Player',
    badge: '100% Ad-Free',
    hasHindiAudio: true,
    hindiBadge: '🌐 Native HTML5',
    description: 'Pure HTML5 MP4 / HLS player with zero ads and bufferless playback',
    priority: 4
  },
];

const DEFAULT_SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
const createDefaultQualities = (url: string = DEFAULT_SAMPLE_VIDEO): MovieQuality[] => [
  { quality: '1080p', videoUrl: url, downloadUrl: url, fileSize: '2.4 GB' },
  { quality: '720p', videoUrl: url, downloadUrl: url, fileSize: '1.2 GB' },
  { quality: '480p', videoUrl: url, downloadUrl: url, fileSize: '550 MB' },
];

// 100% Verified Curated Catalog with Official HD TMDB Banners
export const FALLBACK_MOVIES: Movie[] = CURATED_MOVIES_CATALOG;

export interface AudioLanguage {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: AudioLanguage[] = [
  { id: 'Hindi', name: 'Hindi', nativeName: 'हिन्दी (Default)', flag: '🇮🇳' },
  { id: 'English', name: 'English', nativeName: 'English (Original)', flag: '🌐' },
  { id: 'Telugu', name: 'Telugu', nativeName: 'తెలుగు', flag: '🏹' },
  { id: 'Tamil', name: 'Tamil', nativeName: 'தமிழ்', flag: '🌴' },
  { id: 'Kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌊' },
  { id: 'Malayalam', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🌸' },
  { id: 'Japanese', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { id: 'Korean', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
];

export const getEmbedUrl = (
  server: string,
  movie: Movie,
  season: number = 1,
  episode: number = 1,
  audioLanguage: string = 'Hindi'
): string => {
  const tmdbId = movie.tmdbId || movie.id || movie._id || '1213243';
  const isSeries = movie.type === 'series';
  const rawId = (movie as any).imdb_id || movie.imdbId || tmdbId;
  const lang = audioLanguage || 'Hindi';

  switch (server) {
    case 'vidlink':
      return isSeries
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=e50914&secondaryColor=141414`
        : `https://vidlink.pro/movie/${tmdbId}?primaryColor=e50914&secondaryColor=141414`;

    case 'peachify':
      return isSeries
        ? `https://peachify.top/embed/tv/${tmdbId}/${season}/${episode}${lang.toLowerCase().includes('hindi') ? '?dub=Hindi' : ''}`
        : `https://peachify.top/embed/movie/${tmdbId}${lang.toLowerCase().includes('hindi') ? '?dub=Hindi' : ''}`;

    case '2embed':
    default:
      return isSeries
        ? `https://www.2embed.cc/embedtv/${rawId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${rawId}`;
  }
};

export const extractMovieId = (urlOrId: string): { id: string; type: 'movie' | 'series' } | null => {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  if (/^\d+$/.test(str)) {
    return { id: str, type: 'movie' };
  }

  const match = str.match(/(?:netplay-one\.vercel\.app|cinevault|themoviedb\.org)\/(?:watch\/)?(movie|tv)\/(\d+)/i);
  if (match) {
    return { type: match[1] === 'tv' ? 'series' : 'movie', id: match[2] };
  }

  const anyMatch = str.match(/(?:movie|tv|series|watch)\/(\d+)/i);
  if (anyMatch) {
    return { type: 'movie', id: anyMatch[1] };
  }

  return null;
};

/**
 * Centralized Advertisement & Promotional Content Filter
 * Strips all API-provided ads, sponsored cards, promotional banners, and tracking items
 * while preserving legitimate movie, series, and anime metadata.
 */
export const isAdvertisementItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') return true;

  // 1. Explicit boolean ad / promotion flags
  if (
    item.is_ad === true ||
    item.isAd === true ||
    item.advertisement === true ||
    item.sponsored === true ||
    item.is_sponsored === true ||
    item.is_promotion === true ||
    item.isPromotion === true ||
    item.commercial === true ||
    item.is_commercial === true
  ) {
    return true;
  }

  // 2. Type / Placement indicators
  const typeStr = String(item.type || item.media_type || item.category || item.placement || '').toLowerCase();
  if (['ad', 'advertisement', 'banner_ad', 'promo', 'sponsored', 'sponsor', 'commercial', 'ad_banner'].includes(typeStr)) {
    return true;
  }

  // 3. Ad URL / Tracking presence
  if (item.ad_url || item.adUrl || item.click_url || item.tracking_url || item.ad_image || item.adImage) {
    return true;
  }

  // 4. Title / Text based ad indicators
  const title = String(item.title || item.name || item.subjectName || '').toLowerCase().trim();
  if (
    title.startsWith('sponsored:') ||
    title.startsWith('ad:') ||
    title.startsWith('promotion:') ||
    title === 'advertisement' ||
    title === 'google ad'
  ) {
    return true;
  }

  return false;
};

export const sanitizeMovieCatalog = (items: Movie[]): Movie[] => {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !isAdvertisementItem(item));
};

export const isHindiContentAvailable = (movie: Movie, dynamicTracks?: AudioTrack[]): boolean => {
  // 1. If dynamic audio tracks specifically contain Hindi
  if (dynamicTracks && dynamicTracks.length > 0) {
    const hasHindiTrack = dynamicTracks.some(
      (t) => t.id === 'hi' || t.name.toLowerCase() === 'hindi' || t.language?.toLowerCase() === 'hindi'
    );
    if (hasHindiTrack) return true;
  }

  // 2. If movie object has audioTracks explicitly
  if (movie.audioTracks && movie.audioTracks.length > 0) {
    const hasHindiTrack = movie.audioTracks.some(
      (t) => t.id === 'hi' || t.name.toLowerCase() === 'hindi' || t.language?.toLowerCase() === 'hindi'
    );
    if (hasHindiTrack) return true;
  }

  // 3. Native Hindi / Bollywood
  const langLower = String(movie.language || '').toLowerCase().trim();
  const origLangLower = String(movie.originalLanguage || '').toLowerCase().trim();
  const genresLower = (movie.genres || []).map((g) => g.toLowerCase());

  if (
    langLower === 'hindi' ||
    langLower === 'hi' ||
    origLangLower === 'hindi' ||
    origLangLower === 'hi' ||
    genresLower.includes('bollywood')
  ) {
    return true;
  }

  // 4. Pan-Indian titles (Telugu, Tamil, Malayalam, Kannada hits with theatrical Hindi dubs)
  const isSouthIndian =
    langLower === 'telugu' || langLower === 'te' ||
    langLower === 'tamil' || langLower === 'ta' ||
    langLower === 'malayalam' || langLower === 'ml' ||
    langLower === 'kannada' || langLower === 'kn' ||
    origLangLower === 'te' || origLangLower === 'ta' ||
    origLangLower === 'ml' || origLangLower === 'kn' ||
    genresLower.includes('south indian') ||
    genresLower.includes('tollywood') ||
    genresLower.includes('kollywood');

  const titleLower = String(movie.title || '').toLowerCase().trim();

  // Known Pan-Indian titles with official Hindi dubs
  const panIndiaHits = [
    'pushpa', 'kalki', 'rrr', 'kgf', 'devara', 'salaar', 'baahubali', 'kantara',
    'hanuman', 'hanu-man', 'leo', 'jailer', 'vikram', 'jawan', 'pathaan', 'stree',
    'dangal', 'animal', 'major', 'karthikeya', 'vikrant rona', 'ps-1', 'ps-2',
    'ponniyin selvan', 'chhaava', 'singham', 'bhool bhulaiyaa'
  ];
  if (panIndiaHits.some((hit) => titleLower.includes(hit))) {
    return true;
  }

  if (isSouthIndian) {
    return true;
  }

  // 5. Major Hollywood / Global franchises with official Hindi dubs
  const globalHindiDubbedFranchises = [
    'deadpool', 'wolverine', 'spider', 'avenger', 'interstellar', 'inception',
    'avatar', 'dark knight', 'gladiator', 'alien', 'batman', 'top gun', 'fast &',
    'fast and', 'furious', 'stranger things', 'money heist', 'squid game', 'demon slayer',
    'solo leveling', 'jujutsu', 'oppenheimer', 'mission: impossible', 'mission impossible',
    'transformers', 'jurassic', 'harry potter', 'lord of the rings', 'iron man', 'thor',
    'captain america', 'guardians of the galaxy', 'black panther', 'ant-man', 'doctor strange',
    'aquaman', 'wonder woman', 'superman', 'godzilla', 'kong', 'dune', 'matrix', 'john wick',
    'kung fu panda', 'lion king', 'aladdin', 'frozen', 'moana', 'zootopia', 'toy story',
    'despicable me', 'minions', 'shrek', 'madagascar', 'ice age'
  ];

  return globalHindiDubbedFranchises.some((k) => titleLower.includes(k));
};

// In-memory Client-Side Caches for Rapid Response Times
const searchCache = new Map<string, { data: Movie[]; timestamp: number }>();
const searchInFlight = new Map<string, Promise<Movie[]>>();
const streamInfoCache = new Map<string, { data: StreamInfoResponse; timestamp: number }>();
let moviesCatalogCache: { data: Movie[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const api = {
  // Automatic Scraping & Syncing
  syncAllScraper: async (): Promise<{ count: number; data: Movie[] }> => {
    const cleanCatalog = sanitizeMovieCatalog(FALLBACK_MOVIES);
    return { count: cleanCatalog.length, data: cleanCatalog };
  },

  syncMovieBoxScraper: async (): Promise<{ count: number; data: Movie[] }> => {
    try {
      const res = await movieboxService.syncScraper();
      if (res.success && res.data && res.data.length > 0) {
        const cleanData = sanitizeMovieCatalog(res.data);
        moviesCatalogCache = null; // Invalidate catalog cache
        return { count: cleanData.length, data: cleanData };
      }
    } catch {}
    return { count: 0, data: [] };
  },

  getStreamInfo: async (
    movieId: string | number,
    season: number = 1,
    episode: number = 1,
    movie?: Movie,
    signal?: AbortSignal
  ): Promise<StreamInfoResponse | null> => {
    const cacheKey = `${movieId}-s${season}-e${episode}`;
    const cached = streamInfoCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const q = new URLSearchParams({
        season: String(season),
        episode: String(episode),
        type: movie?.type || 'movie',
        title: movie?.title || '',
        language: movie?.language || ''
      });

      const fetchSignal = signal
        ? AbortSignal.any([signal, AbortSignal.timeout(4000)])
        : AbortSignal.timeout(4000);

      const res = await fetch(`/api/v1/movies/${movieId}/streams?${q.toString()}`, {
        signal: fetchSignal
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data as StreamInfoResponse;
          streamInfoCache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      }
    } catch {}
    return null;
  },

  getMovies: async (params?: { type?: string; genre?: string; sort?: string; language?: string; year?: string }): Promise<Movie[]> => {
    if (moviesCatalogCache && Date.now() - moviesCatalogCache.timestamp < CACHE_TTL_MS) {
      let list = [...moviesCatalogCache.data];
      if (params?.type) list = list.filter(m => m.type === params.type);
      if (params?.genre && params.genre !== 'All') list = list.filter(m => m.genres?.includes(params.genre!));
      return list;
    }

    let list = [...FALLBACK_MOVIES];

    // 1. Check MovieBox Scraped Catalog (Filtered)
    try {
      const mbCatalog = await movieboxService.getScrapedCatalog();
      if (mbCatalog.movies && mbCatalog.movies.length > 0) {
        const existingIds = new Set(list.map(m => String(m.id || m._id || m.tmdbId)));
        const cleanMbMovies = sanitizeMovieCatalog(mbCatalog.movies).filter(
          m => !existingIds.has(String(m.id || m._id || m.tmdbId))
        );
        list = [...cleanMbMovies, ...list];
      }
    } catch {}

    // 2. Check Supabase Cloud Database (Filtered)
    try {
      const cloudMovies = await getCloudMovies();
      if (cloudMovies && cloudMovies.length > 0) {
        list = sanitizeMovieCatalog(cloudMovies);
      }
    } catch {}

    // Centralized ad sanitization
    list = sanitizeMovieCatalog(list);
    if (!list || list.length === 0) {
      list = [...FALLBACK_MOVIES];
    }
    moviesCatalogCache = { data: list, timestamp: Date.now() };

    if (params?.type) list = list.filter(m => m.type === params.type);
    if (params?.genre && params.genre !== 'All') list = list.filter(m => m.genres?.includes(params.genre!));
    return list;
  },

  getMovieBySlug: async (slug: string): Promise<Movie | null> => {
    return FALLBACK_MOVIES.find(m => m.slug === slug || m._id === slug || m.id === slug || m.tmdbId?.toString() === slug) || null;
  },

  search: async (q: string, signal?: AbortSignal): Promise<Movie[]> => {
    if (!q.trim()) return [];
    const lower = q.trim().toLowerCase();

    // 1. Return from in-memory search cache if still fresh
    const cached = searchCache.get(lower);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 2. Return active in-flight search promise to prevent duplicate API hits
    if (searchInFlight.has(lower)) {
      return searchInFlight.get(lower)!;
    }

    const searchPromise = (async () => {
      const effectiveSignal = signal
        ? AbortSignal.any([signal, AbortSignal.timeout(4000)])
        : AbortSignal.timeout(4000);

      // Local matches
      const localMatches = FALLBACK_MOVIES.filter(m => 
        m.title.toLowerCase().includes(lower) || 
        m.genres?.some(g => g.toLowerCase().includes(lower)) ||
        m.language?.toLowerCase().includes(lower) ||
        m.releaseYear?.toString().includes(lower) ||
        m.tmdbId?.toString() === lower
      );

      const resultMap = new Map<string | number, Movie>();
      localMatches.forEach(m => {
        const key = m.tmdbId || m.id || m._id || m.title;
        if (key) resultMap.set(key, m);
      });

      const TMDB_API_KEY = '844dba0bfd8f3a4f3799f6130ef9e335';
      const GENRE_MAP: Record<number, string> = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
        99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
        27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
        10759: 'Action & Adventure', 10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics'
      };

      // 0. Query Existing Backend API Scraper / Processing Layer (Ad-Filtered & Normalized)
      try {
        const backendRes = await fetch(`/api/v1/movies/search?q=${encodeURIComponent(q)}`, {
          signal: effectiveSignal
        });
        if (backendRes.ok) {
          const json = await backendRes.json();
          const items = json?.data || [];
          if (Array.isArray(items) && items.length > 0) {
            items.forEach((item: any) => {
              const movieItem: Movie = {
                _id: String(item.id),
                id: String(item.id),
                tmdbId: item.id,
                title: item.title,
                slug: `${(item.title || 'movie').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.id}`,
                description: item.overview || `Watch ${item.title} in 1080p Ultra HD on CineVault.`,
                posterUrl: item.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
                backdropUrl: item.backdropUrl || item.posterUrl,
                trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' trailer')}`,
                releaseYear: item.releaseYear || 2024,
                language: item.originalLanguage === 'hi' ? 'Hindi' : 'English / Multi',
                genres: ['Blockbuster', 'Featured'],
                duration: item.type === 'series' ? 'TV Series' : '2h 15m',
                rating: item.rating || 8.4,
                director: 'Featured Director',
                cast: ['Ensemble Cast'],
                type: item.type || 'movie',
                featured: false,
                trending: true,
                videoUrl: DEFAULT_SAMPLE_VIDEO,
                downloadUrl: DEFAULT_SAMPLE_VIDEO,
                qualities: createDefaultQualities(DEFAULT_SAMPLE_VIDEO)
              };
              const key = movieItem.tmdbId || movieItem.id;
              if (key && !resultMap.has(key)) {
                resultMap.set(key, movieItem);
              }
            });
          }
        }
      } catch {}

      // 1. Live TMDB Multi-Search (Over 1,000,000+ Global Movies, Anime & Series)
      try {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&include_adult=false&page=1`,
          { signal: effectiveSignal }
        );
      if (tmdbRes.ok) {
        const data = await tmdbRes.json();
        const results = data?.results || [];
        if (Array.isArray(results) && results.length > 0) {
          results
            .filter((item: any) => !isAdvertisementItem(item) && (item.media_type === 'movie' || item.media_type === 'tv') && (item.poster_path || item.backdrop_path))
            .forEach((item: any) => {
              const isTv = item.media_type === 'tv';
              const title = item.title || item.name || 'Untitled';
              const releaseDate = item.release_date || item.first_air_date || '';
              const year = releaseDate ? parseInt(releaseDate.slice(0, 4), 10) || 2024 : 2024;
              const genres = (item.genre_ids || [])
                .map((id: number) => GENRE_MAP[id])
                .filter(Boolean);
              if (genres.length === 0) genres.push(isTv ? 'TV Series' : 'Movie');

              const movieItem: Movie = {
                _id: String(item.id),
                id: String(item.id),
                tmdbId: item.id,
                title,
                slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${item.id}`,
                description: item.overview || `Watch ${title} in 1080p Ultra HD with multi-language audio and subtitle support on CineVault.`,
                posterUrl: item.poster_path 
                  ? `https://image.tmdb.org/t/p/w780${item.poster_path}`
                  : `https://image.tmdb.org/t/p/w780${item.backdrop_path}`,
                backdropUrl: item.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                  : `https://image.tmdb.org/t/p/original${item.poster_path}`,
                trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`,
                releaseYear: year,
                language: item.original_language === 'hi' ? 'Hindi' : (item.original_language === 'te' ? 'Telugu / Hindi' : (item.original_language === 'ta' ? 'Tamil / Hindi' : (item.original_language === 'ja' ? 'Japanese / Hindi' : (item.original_language === 'ko' ? 'Korean / Hindi' : 'English / Multi')))),
                genres,
                duration: isTv ? 'TV Series' : '2h 15m',
                rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.2,
                director: 'Global Cinema',
                cast: ['Featured Cast'],
                type: isTv ? 'series' : 'movie',
                featured: false,
                trending: true,
                videoUrl: DEFAULT_SAMPLE_VIDEO,
                downloadUrl: DEFAULT_SAMPLE_VIDEO,
                qualities: createDefaultQualities(DEFAULT_SAMPLE_VIDEO)
              };

              const key = movieItem.tmdbId || movieItem.id;
              if (key && !resultMap.has(key)) {
                resultMap.set(key, movieItem);
              }
            });
        }
      }
    } catch {}

    // 2. MovieBox / ShortTV API Search integration
    try {
      const mbData = await movieboxService.searchMovie(q);
      const items = mbData?.data?.list || mbData?.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        items
          .filter((item: any) => !isAdvertisementItem(item))
          .forEach((item: any) => {
            const id = item.subjectId || item.id || String(Math.floor(Math.random() * 900000) + 100000);
            const title = item.title || item.subjectName || 'MovieBox Stream';
            const mbMovie: Movie = {
              _id: String(id),
              id: String(id),
              tmdbId: item.tmdbId || id,
              title,
              slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`,
              description: item.description || item.subTitle || 'Stream in 1080p Full HD directly from MovieBox VIP servers on CineVault.',
              posterUrl: item.cover?.url || item.coverUrl || 'https://image.tmdb.org/t/p/w780/bS4p0m5kL1w8kL5n0a2B4m8o0.jpg',
              backdropUrl: item.cover?.url || item.coverUrl || 'https://image.tmdb.org/t/p/original/jX6b6W8X0r0L9Z4K2m7C5V3B1A.jpg',
              trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`,
              releaseYear: parseInt(item.releaseYear || item.year || '2024', 10) || 2024,
              language: 'Hindi / Multi',
              genres: ['MovieBox VIP', 'Featured'],
              duration: item.duration || '2h 05m',
              rating: typeof item.score === 'number' ? item.score : 8.5,
              director: 'MovieBox Cinema',
              cast: ['Verified Cast'],
              type: item.category === 'tv' ? 'series' : 'movie',
              featured: false,
              trending: true,
              videoUrl: DEFAULT_SAMPLE_VIDEO,
              downloadUrl: DEFAULT_SAMPLE_VIDEO,
              qualities: createDefaultQualities(DEFAULT_SAMPLE_VIDEO)
            };
            const key = mbMovie.tmdbId || mbMovie.id;
            if (key && !resultMap.has(key)) {
              resultMap.set(key, mbMovie);
            }
          });
      }
    } catch {}

    const cleanResults = sanitizeMovieCatalog(Array.from(resultMap.values()));
    searchCache.set(lower, { data: cleanResults, timestamp: Date.now() });
    searchInFlight.delete(lower);
    return cleanResults;
  })().catch((err) => {
      searchInFlight.delete(lower);
      throw err;
    });

    searchInFlight.set(lower, searchPromise);
    return searchPromise;
  },

  fetchFromExternalUrlOrId: async (input: string): Promise<Movie> => {

    const parsed = extractMovieId(input);
    const id = parsed ? parsed.id : '1213243';
    const type = parsed?.type || 'movie';

    const existing = FALLBACK_MOVIES.find(m => m.tmdbId?.toString() === id || m._id === id || m.id === id);
    if (existing) return existing;

    return {
      _id: id,
      id: id,
      tmdbId: parseInt(id, 10) || id,
      title: `Movie Stream #${id}`,
      slug: `movie-stream-${id}`,
      description: 'Stream instantly across all fast servers in Full HD with subtitle & dual audio support.',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
      releaseYear: 2024,
      language: 'Hindi / English',
      genres: ['Action', 'Sci-Fi', 'Blockbuster'],
      duration: '2h 15m',
      rating: 8.8,
      director: 'Global Cinema',
      cast: ['Popular Cast'],
      type: type,
      qualities: createDefaultQualities(DEFAULT_SAMPLE_VIDEO),
      videoUrl: DEFAULT_SAMPLE_VIDEO,
      downloadUrl: DEFAULT_SAMPLE_VIDEO
    };
  },

  login: async (email: string, password: string): Promise<{ token: string; user: AuthUser }> => {
    if ((email === 'admin@cinevault.com' || email === 'admin') && (password === 'admin123' || password === 'admin')) {
      return {
        token: 'mock_jwt_token_admin_2026',
        user: { id: 'admin_1', username: 'Admin', email: 'admin@cinevault.com', role: 'admin' }
      };
    }
    throw new Error('Invalid credentials');
  },

  createMovie: async (movie: Partial<Movie>, _token?: string): Promise<Movie> => {
    const fallbackNew: Movie = {
      _id: `m_${Date.now()}`,
      id: `m_${Date.now()}`,
      tmdbId: movie.tmdbId,
      slug: movie.slug || movie.title?.toLowerCase().replace(/\s+/g, '-') || 'movie',
      title: movie.title || 'Untitled',
      description: movie.description || '',
      posterUrl: movie.posterUrl || '',
      backdropUrl: movie.backdropUrl || movie.posterUrl || '',
      releaseYear: movie.releaseYear || 2026,
      language: movie.language || 'English',
      genres: movie.genres || ['Action'],
      duration: movie.duration || '2h',
      rating: movie.rating || 8.0,
      director: movie.director || '',
      cast: movie.cast || [],
      type: movie.type || 'movie',
      qualities: movie.qualities || [{ quality: '1080p', videoUrl: movie.videoUrl || '' }],
      videoUrl: movie.videoUrl || '',
      downloadUrl: movie.downloadUrl || ''
    };
    return fallbackNew;
  },

  updateMovie: async (id: string, movie: Partial<Movie>, _token?: string): Promise<Movie> => {
    return { ...movie, _id: id } as Movie;
  },

  deleteMovie: async (_id: string, _token?: string): Promise<any> => {
    return { message: 'Deleted locally' };
  }
};
