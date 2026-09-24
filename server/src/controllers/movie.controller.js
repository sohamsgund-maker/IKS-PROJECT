import { TmdbService } from '../services/tmdb.service.js';
import { MovieboxService } from '../services/moviebox.service.js';
import { MetadataService } from '../services/metadata.service.js';
import { ApiProcessor, KNOWN_LANGUAGES } from '../services/apiProcessor.js';
import { AutoScraperService } from '../services/autoScraper.service.js';
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
          const bestMatch = MovieboxService.findBestTitleMatch(title, filteredMb);
          if (bestMatch) {
            playInfo = await MovieboxService.getPlayInfo(
              bestMatch.id || bestMatch.subjectId,
              bestMatch.detailPath || bestMatch.detail_path,
              isSeries ? 'tv' : 'movie',
              Number(season),
              Number(episode)
            );
          }
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

  // --- MovieBox Scraper Endpoints ---

  static async getMovieboxHome(req, res, next) {
    try {
      const { refresh = 'false' } = req.query;
      const scraper = AutoScraperService.getInstance();

      // If automated scraper has populated the catalog and client hasn't requested a live force refresh, serve instantly
      if (refresh !== 'true' && scraper.hasCatalog()) {
        const cached = scraper.getCatalog();
        return ApiResponse.success(res, {
          status: 'success',
          source: 'auto_scraper_cache',
          featured: cached.featured,
          rows: cached.shelves,
          total_titles: cached.totalTitles,
          lastUpdated: cached.lastUpdated,
        });
      }

      const data = await MovieboxService.getHomeCatalog();
      return ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  static async searchMoviebox(req, res, next) {
    try {
      const { q = '', page = 1, size = 20, type = 'all' } = req.query;
      const results = await MovieboxService.search(q, Number(page), Number(size), type);
      return ApiResponse.success(res, results, { count: results.length });
    } catch (error) {
      next(error);
    }
  }

  static async getMovieboxTrending(req, res, next) {
    try {
      const { type = 'all', page = 1, size = 24, genre = '' } = req.query;
      let results = [];
      if (genre && genre !== 'all' && genre !== 'trending') {
        results = await MovieboxService.getByGenre(genre, type === 'all' ? 'movie' : type);
      } else {
        results = await MovieboxService.getTrending(type, Number(page), Number(size));
      }
      return ApiResponse.success(res, results, { count: results.length });
    } catch (error) {
      next(error);
    }
  }

  static async getMovieboxDetails(req, res, next) {
    try {
      const { id = '', path = '', type = 'movie', title = '' } = req.query;
      const scraper = AutoScraperService.getInstance();
      const cached = scraper.getItemById(id) || (path ? scraper.getItemById(path) : null);
      if (cached && (cached.backdropUrl || cached.overview?.length > 40)) {
        return ApiResponse.success(res, { ...cached, source: 'auto_scraper_cache' });
      }

      const details = await MovieboxService.getDetails(id, path, type, title);
      return ApiResponse.success(res, details);
    } catch (error) {
      next(error);
    }
  }

  static async getMovieboxStreams(req, res, next) {
    try {
      const { id, type = 'movie', season = 1, episode = 1, path = '', title = '' } = req.query;
      const streams = await MovieboxService.getStreams(id, type, Number(season), Number(episode), path, title);
      return ApiResponse.success(res, streams);
    } catch (error) {
      next(error);
    }
  }

  static async getMovieboxSuggestions(req, res, next) {
    try {
      const { q = '', size = 8 } = req.query;
      const suggestions = await MovieboxService.getSuggestions(q, Number(size));
      return ApiResponse.success(res, suggestions);
    } catch (error) {
      next(error);
    }
  }
}

