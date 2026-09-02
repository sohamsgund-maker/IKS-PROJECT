import { TmdbService } from '../services/tmdb.service.js';
import { MovieboxService } from '../services/moviebox.service.js';
import { MetadataService } from '../services/metadata.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class MovieController {
  static async search(req, res, next) {
    try {
      const { q, page = 1 } = req.query;
      const currentPage = Number(page);

      const rawData = await TmdbService.searchMovies(q, currentPage);
      const normalizedItems = (rawData.results || [])
        .filter((item) => item.media_type !== 'person')
        .map(MetadataService.normalizeMovieItem);

      const pagination = {
        page: rawData.page || currentPage,
        totalResults: rawData.total_results || normalizedItems.length,
        totalPages: rawData.total_pages || 1,
        hasNextPage: rawData.page < rawData.total_pages,
        hasPrevPage: rawData.page > 1,
      };

      return ApiResponse.success(res, normalizedItems, { pagination });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const rawData = await TmdbService.getMovieDetails(Number(id));
      const normalizedDetails = MetadataService.normalizeMovieDetails(rawData);

      return ApiResponse.success(res, normalizedDetails);
    } catch (error) {
      next(error);
    }
  }

  static async getTrending(req, res, next) {
    try {
      const { page = 1 } = req.query;
      const currentPage = Number(page);

      const rawData = await TmdbService.getTrending(currentPage);
      const normalizedItems = (rawData.results || [])
        .filter((item) => item.media_type !== 'person')
        .map(MetadataService.normalizeMovieItem);

      const pagination = {
        page: rawData.page || currentPage,
        totalResults: rawData.total_results || normalizedItems.length,
        totalPages: rawData.total_pages || 1,
        hasNextPage: rawData.page < rawData.total_pages,
        hasPrevPage: rawData.page > 1,
      };

      return ApiResponse.success(res, normalizedItems, { pagination });
    } catch (error) {
      next(error);
    }
  }

  static async getStreams(req, res, next) {
    try {
      const { id } = req.params;
      const { season = 1, episode = 1, lang = 'Hindi' } = req.query;

      // 1. Fetch Movie Details from TMDB
      const movieDetails = await TmdbService.getMovieDetails(Number(id));
      const title = movieDetails.title || movieDetails.name;

      // 2. Search MovieBox for matching subject
      const movieboxItems = await MovieboxService.search(title, 1, 5);
      let streams = [];

      if (movieboxItems.length > 0) {
        const bestMatch = movieboxItems[0];
        const playInfo = await MovieboxService.getPlayInfo(bestMatch.id || bestMatch.subjectId);
        if (playInfo && playInfo.qualities) {
          streams = playInfo.qualities.map((q) => ({
            quality: q.quality || '1080p',
            url: q.url || q.videoUrl,
          }));
        }
      }

      // 3. Fallback to Ultra 4K Direct HLS Provider
      if (streams.length === 0) {
        const isSeries = Boolean(movieDetails.number_of_seasons);
        const color = 'E50914';
        const fallbackUrl = isSeries
          ? `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=${color}&multiAudio=true&autoplay=true`
          : `https://vidlink.pro/movie/${id}?primaryColor=${color}&multiAudio=true&autoplay=true`;

        streams.push({
          quality: '4K Ultra HD',
          url: fallbackUrl,
          type: 'embed_hls',
        });
      }

      return ApiResponse.success(res, {
        tmdbId: Number(id),
        title,
        selectedLanguage: lang,
        streams,
      });
    } catch (error) {
      next(error);
    }
  }
}
