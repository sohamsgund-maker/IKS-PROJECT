/**
 * MovieBox & ShortTV API Service for CineVault (React 19 + TypeScript + Vite)
 * Real-time scraper, stream extractor and catalog synchronizer
 */

import type { Movie } from '../types/movie';

export interface MovieBoxStreamQuality {
  quality: string;
  url: string;
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

const API_BASE = 'http://localhost:5000/api/moviebox';
const MOVIEBOX_DIRECT_BASE = 'https://api.aoneroom.com';
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
   * Fetch freshly scraped MovieBox Catalog from Backend
   */
  async getScrapedCatalog(): Promise<{ count: number; movies: Movie[] }> {
    try {
      const response = await fetch(`${API_BASE}/catalog`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.movies) && json.movies.length > 0) {
          return { count: json.movies.length, movies: json.movies };
        }
      }
    } catch {
      // Backend offline fallback
    }

    return { count: 0, movies: [] };
  }

  /**
   * Trigger Real-Time MovieBox Scrape & Sync from Backend
   */
  async syncScraper(): Promise<{ success: boolean; count: number; data: Movie[] }> {
    try {
      const response = await fetch(`${API_BASE}/sync`, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return { success: true, count: json.data.length, data: json.data };
        }
      }
    } catch {
      // Fallback
    }

    return { success: false, count: 0, data: [] };
  }

  /**
   * Search MovieBox API by Movie/TV Title (Backend Proxy with direct API fallback)
   */
  async searchMovie(keyword: string, page: number = 1, size: number = 20): Promise<any> {
    try {
      // Try backend proxy first
      const proxyRes = await fetch(`${API_BASE}/search?q=${encodeURIComponent(keyword)}&page=${page}&size=${size}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success && Array.isArray(json.data)) {
          return { data: { list: json.data } };
        }
      }
    } catch {}

    // Fallback: Direct call
    try {
      const params = new URLSearchParams({ keyword, page: String(page), size: String(size) });
      const url = `${MOVIEBOX_DIRECT_BASE}/wefeed-mobile-bff/subject-api/search?${params.toString()}`;

      const response = await fetch(url, { 
        method: 'GET', 
        headers: this.headers,
        signal: AbortSignal.timeout(4000)
      });
      if (!response.ok) return null;
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
      const proxyRes = await fetch(`${API_BASE}/stream/${subjectId}`, { signal: AbortSignal.timeout(4000) });
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success) return json.data;
      }
    } catch {}

    try {
      const params = new URLSearchParams({ subjectId });
      const url = `${MOVIEBOX_DIRECT_BASE}/wefeed-mobile-bff/subject-api/play-info?${params.toString()}`;

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
      const url = `${MOVIEBOX_DIRECT_BASE}/wefeed-mobile-bff/subject-api/get-ext-captions?${params.toString()}`;

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
