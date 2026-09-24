import axios from 'axios';
import { config } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const tmdbClient = axios.create({
  baseURL: config.tmdb.baseUrl,
  timeout: config.tmdb.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export class TmdbService {
  static async searchMovies(query, page = 1) {
    try {
      const response = await tmdbClient.get('/search/multi', {
        params: {
          api_key: config.tmdb.apiKey,
          query,
          page,
          include_adult: false,
        },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  static async getMovieDetails(id, mediaType = 'movie') {
    try {
      const endpoint = mediaType === 'series' || mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`;
      const response = await tmdbClient.get(endpoint, {
        params: {
          api_key: config.tmdb.apiKey,
          append_to_response: 'credits,videos,images',
        },
      });
      return response.data;
    } catch (error) {
      // If movie lookup failed with 404, try tv as fallback
      if (error.response && error.response.status === 404 && mediaType !== 'tv' && mediaType !== 'series') {
        try {
          const tvResponse = await tmdbClient.get(`/tv/${id}`, {
            params: {
              api_key: config.tmdb.apiKey,
              append_to_response: 'credits,videos,images',
            },
          });
          return tvResponse.data;
        } catch {
          // fallback failed, continue to original error handling
        }
      }
      this.handleAxiosError(error);
    }
  }

  static async getTrending(page = 1) {
    try {
      const response = await tmdbClient.get('/trending/all/day', {
        params: {
          api_key: config.tmdb.apiKey,
          page,
        },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  static handleAxiosError(error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw ApiError.timeout('Upstream TMDB API request timed out (limit: 5000ms)');
    }

    if (error.response) {
      if (error.response.status === 404) {
        throw ApiError.notFound('Movie or media item not found on upstream provider');
      }
      throw new ApiError(
        error.response.data?.status_message || 'Upstream provider error',
        error.response.status,
        'UPSTREAM_ERROR'
      );
    }

    throw new ApiError(error.message || 'Failed to connect to upstream service', 500);
  }
}
