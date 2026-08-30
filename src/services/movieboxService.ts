/**
 * MovieBox & ShortTV API Service for CineVault (React 19 + TypeScript + Vite)
 * Scraped and extracted from com.community.oneroom (base.apk)
 */

export interface MovieBoxStreamQuality {
  quality: string; // e.g. "1080p", "720p", "480p"
  url: string;     // Direct video stream URL
}

export interface MovieBoxSearchResult {
  subjectId: string;
  title: string;
  coverUrl?: string;
  releaseYear?: string;
  category?: string;
}

export interface MovieBoxTmdbResponse {
  tmdbId: string | number;
  title: string;
  releaseYear?: string;
  movieboxSubjectId?: string;
  streams?: MovieBoxStreamQuality[];
  subtitles?: Array<{ lang: string; url: string }>;
  rawMovieBoxResults?: any;
}

const MOVIEBOX_BASE_URL = 'https://api.aoneroom.com';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';

export class MovieBoxService {
  private region: string;
  private tmdbApiKey: string;

  constructor(tmdbApiKey: string = DEFAULT_TMDB_API_KEY, region: string = 'IN') {
    this.tmdbApiKey = tmdbApiKey;
    this.region = region;
  }

  private get headers(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) OkHttp/4.9.3',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-tr-devtype': 'android',
      'x-tr-region': this.region,
    };
  }

  /**
   * Search MovieBox API by Movie/TV Title
   */
  async searchMovie(keyword: string, page: number = 1, size: number = 20): Promise<any> {
    try {
      const params = new URLSearchParams({ keyword, page: String(page), size: String(size) });
      const url = `${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/search?${params.toString()}`;

      const response = await fetch(url, { 
        method: 'GET', 
        headers: this.headers,
        signal: AbortSignal.timeout(4000)
      });
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch Video Stream Links (1080p, 720p, 480p) using MovieBox subjectId
   */
  async getStreamInfo(subjectId: string, token?: string): Promise<any> {
    try {
      const params = new URLSearchParams({ subjectId });
      const url = `${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/play-info?${params.toString()}`;

      const reqHeaders = { ...this.headers };
      if (token) {
        reqHeaders['token'] = token;
      }

      const response = await fetch(url, { 
        method: 'GET', 
        headers: reqHeaders,
        signal: AbortSignal.timeout(4000)
      });
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetch Subtitles / Captions for a MovieBox subjectId
   */
  async getSubtitles(subjectId: string): Promise<any> {
    try {
      const params = new URLSearchParams({ subjectId });
      const url = `${MOVIEBOX_BASE_URL}/wefeed-mobile-bff/subject-api/get-ext-captions?${params.toString()}`;

      const response = await fetch(url, { 
        method: 'GET', 
        headers: this.headers,
        signal: AbortSignal.timeout(3000)
      });
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Extract MovieBox Stream using TMDB ID
   */
  async getMovieByTmdbId(tmdbId: string | number, mediaType: 'movie' | 'tv' = 'movie'): Promise<MovieBoxTmdbResponse | null> {
    try {
      // Step 1: Query TMDB for movie metadata
      const tmdbRes = await fetch(
        `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${this.tmdbApiKey}`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (!tmdbRes.ok) return null;
      const tmdbData = await tmdbRes.json();
      const title: string = tmdbData.title || tmdbData.name;
      const releaseDate: string = tmdbData.release_date || tmdbData.first_air_date || '';
      const releaseYear = releaseDate.slice(0, 4);

      // Step 2: Search MovieBox API
      const searchRes = await this.searchMovie(title);

      // Step 3: Extract matching subjectId
      let subjectId: string | undefined;
      const items = searchRes?.data?.list || searchRes?.data?.items || [];
      if (items.length > 0) {
        subjectId = items[0].subjectId || items[0].id;
      }

      // Step 4: Fetch Stream Links & Subtitles
      let streamData: any = null;
      let subtitleData: any = null;

      if (subjectId) {
        streamData = await this.getStreamInfo(subjectId);
        subtitleData = await this.getSubtitles(subjectId);
      }

      return {
        tmdbId,
        title,
        releaseYear,
        movieboxSubjectId: subjectId,
        streams: streamData,
        subtitles: subtitleData,
        rawMovieBoxResults: searchRes,
      };
    } catch {
      return null;
    }
  }
}

export const movieboxService = new MovieBoxService();
