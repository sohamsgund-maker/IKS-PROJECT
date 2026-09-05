import type { Movie, AuthUser, MovieQuality, StreamInfoResponse } from '../types/movie';
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
    name: 'VidLink Ultra (Multi-Audio & Hindi)',
    badge: 'Primary VIP #1',
    hasHindiAudio: true,
    hindiBadge: '🇮🇳 Real Hindi Audio Track',
    description: 'Fast 1080p bufferless stream with native Hindi audio track switcher and subtitles',
    priority: 1
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed 4K (Hindi Auto-Detect)',
    badge: '4K Multi',
    hasHindiAudio: true,
    hindiBadge: '🇮🇳 Hindi Dub Auto-Detected',
    description: 'Universal 4K multi-server scraper prioritizing Hindi audio streams',
    priority: 2
  },
  {
    id: 'videasy',
    name: 'Videasy HD Stream',
    badge: 'Clean Player',
    hasHindiAudio: true,
    hindiBadge: '🇮🇳 Hindi Audio & Subtitles',
    description: 'Direct multi-source stream with clean player and Hindi audio track support',
    priority: 3
  },
  {
    id: 'moviebox',
    name: 'MovieBox / ShortTV VIP',
    badge: 'High Speed CDN',
    hasHindiAudio: true,
    hindiBadge: '🇮🇳 Hindi Audio Stream',
    description: 'Direct high-speed stream from MovieBox VIP servers with Hindi audio',
    priority: 4
  },
  {
    id: 'peachify',
    name: 'Peachify VIP Stream',
    badge: 'Fixed 1080p',
    hasHindiAudio: true,
    hindiBadge: '🇮🇳 Hindi Dual Audio Track',
    description: 'Direct 1080p stream with Hindi audio track support',
    priority: 5
  },
  {
    id: 'vidsrc_pm',
    name: 'VidSrc Global 1080p CDN',
    badge: 'Global 1080p',
    hasHindiAudio: false,
    hindiBadge: '🌐 Original + Hindi Subtitles',
    description: 'Direct high-speed multi-source original audio stream with multi-subtitles',
    priority: 6
  },
  {
    id: 'smashystream',
    name: 'SmashyStream Backup',
    badge: 'Backup',
    hasHindiAudio: false,
    hindiBadge: '🌐 Original Audio',
    description: 'Reliable cloud backup server for global movies and series',
    priority: 7
  },
  {
    id: '2embed',
    name: '2Embed Full TV',
    badge: 'Full Seasons',
    hasHindiAudio: false,
    hindiBadge: '🌐 Original Audio',
    description: 'Comprehensive TV shows and multi-season support',
    priority: 8
  },
  {
    id: 'vidking',
    name: 'VidKing 4K Ultra',
    badge: 'Ultra HD',
    hasHindiAudio: false,
    hindiBadge: '🌐 Original Audio',
    description: 'High-bitrate server with auto-next episode and 4K capability',
    priority: 9
  },
  {
    id: 'direct',
    name: 'Direct HTML5 Player',
    badge: '100% Up',
    hasHindiAudio: false,
    hindiBadge: '🌐 Direct Video',
    description: 'Plays direct media stream with 100% bufferless uptime',
    priority: 10
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
  const color = 'E50914';
  const lang = audioLanguage || 'Hindi';

  switch (server) {
    case 'autoembed':
      return isSeries
        ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}?lang=${encodeURIComponent(lang)}`
        : `https://autoembed.co/movie/tmdb/${tmdbId}?lang=${encodeURIComponent(lang)}`;

    case 'videasy':
      return isSeries
        ? `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=${color}&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`
        : `https://player.videasy.net/movie/${tmdbId}?color=${color}`;

    case 'smashystream':
      return isSeries
        ? `https://player.smashystream.com/tv/${tmdbId}?s=${season}&e=${episode}`
        : `https://player.smashystream.com/movie/${tmdbId}`;

    case 'vidking':
      return isSeries
        ? `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=${color}&autoPlay=true&nextEpisode=true&episodeSelector=true`
        : `https://www.vidking.net/embed/movie/${tmdbId}?color=${color}&autoPlay=true`;

    case 'vidlink':
      return isSeries
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=${color}&multiAudio=true&autoplay=true&nextbutton=true`
        : `https://vidlink.pro/movie/${tmdbId}?primaryColor=${color}&multiAudio=true&autoplay=true&nextbutton=true`;

    case '2embed':
      return isSeries
        ? `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${tmdbId}`;

    default:
      return isSeries
        ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`
        : `https://autoembed.co/movie/tmdb/${tmdbId}`;
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
        return { count: cleanData.length, data: cleanData };
      }
    } catch {}
    return { count: 0, data: [] };
  },

  getStreamInfo: async (movieId: string | number, season: number = 1, episode: number = 1): Promise<StreamInfoResponse | null> => {
    try {
      const res = await fetch(`/api/v1/movies/${movieId}/streams?season=${season}&episode=${episode}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data as StreamInfoResponse;
        }
      }
    } catch {}
    return null;
  },

  getMovies: async (params?: { type?: string; genre?: string; sort?: string; language?: string; year?: string }): Promise<Movie[]> => {
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

    if (params?.type) list = list.filter(m => m.type === params.type);
    if (params?.genre && params.genre !== 'All') list = list.filter(m => m.genres?.includes(params.genre!));
    return list;
  },

  getMovieBySlug: async (slug: string): Promise<Movie | null> => {
    return FALLBACK_MOVIES.find(m => m.slug === slug || m._id === slug || m.id === slug || m.tmdbId?.toString() === slug) || null;
  },

  search: async (q: string): Promise<Movie[]> => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();

    // Local matches
    const localMatches = FALLBACK_MOVIES.filter(m => 
      m.title.toLowerCase().includes(lower) || 
      m.genres?.some(g => g.toLowerCase().includes(lower)) ||
      m.language?.toLowerCase().includes(lower) ||
      m.releaseYear?.toString().includes(lower) ||
      m.tmdbId?.toString() === q.trim()
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
        signal: AbortSignal.timeout(4000)
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
        { signal: AbortSignal.timeout(4000) }
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

    return sanitizeMovieCatalog(Array.from(resultMap.values()));
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
