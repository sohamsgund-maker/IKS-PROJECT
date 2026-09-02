import { TmdbService } from '../services/tmdb.service.js';
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
}
