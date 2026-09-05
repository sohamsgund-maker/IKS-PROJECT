import { TmdbService } from '../services/tmdb.service.js';
import { MovieboxService } from '../services/moviebox.service.js';
import { MetadataService } from '../services/metadata.service.js';
import { ApiProcessor, KNOWN_LANGUAGES } from '../services/apiProcessor.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class MovieController {
  static async search(req, res, next) {
    try {
      const { q, page = 1 } = req.query;
      const currentPage = Number(page);

      const rawData = await TmdbService.searchMovies(q, currentPage);
      const filteredRaw = ApiProcessor.filterCatalog(rawData.results || []);
      const normalizedItems = filteredRaw
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
      const { type = 'movie' } = req.query;
      const rawData = await TmdbService.getMovieDetails(Number(id), type);
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
      const filteredRaw = ApiProcessor.filterCatalog(rawData.results || []);
      const normalizedItems = filteredRaw
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
      const { season = 1, episode = 1, type = 'movie', title: qTitle, language: qLang } = req.query;

      // 1. Fetch Movie Details from TMDB
      let movieDetails = {};
      try {
        movieDetails = await TmdbService.getMovieDetails(Number(id), type);
      } catch {
        movieDetails = { id, title: qTitle || `Stream ${id}` };
      }
      const title = movieDetails.title || movieDetails.name || qTitle || `Title #${id}`;
      const isSeries = Boolean(movieDetails.number_of_seasons || type === 'series' || req.query.type === 'series');

      // 2. Search MovieBox for matching subject play info
      let playInfo = null;
      try {
        const movieboxItems = await MovieboxService.search(title, 1, 5);
        const filteredMb = ApiProcessor.filterCatalog(movieboxItems);
        if (filteredMb.length > 0) {
          const bestMatch = filteredMb[0];
          playInfo = await MovieboxService.getPlayInfo(bestMatch.id || bestMatch.subjectId);
        }
      } catch {}

      // 3. Process Streams, Dynamic Audio Languages & Hindi-First Selection
      const origLang = movieDetails.original_language || movieDetails.language || qLang || 'en';
      const genresList = (movieDetails.genres || []).map((g) => g.name || g);

      const processedStreamData = ApiProcessor.processStreamsAndAudio({
        tmdbId: Number(id),
        title,
        originalLanguage: origLang,
        genres: genresList,
        season: Number(season),
        episode: Number(episode),
        isSeries,
        upstreamPlayInfo: playInfo,
      });

      return ApiResponse.success(res, processedStreamData);
    } catch (error) {
      next(error);
    }
  }

  static async getLanguages(req, res) {
    return ApiResponse.success(res, Object.values(KNOWN_LANGUAGES));
  }
}
