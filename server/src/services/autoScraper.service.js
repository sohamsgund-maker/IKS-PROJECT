import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import { MovieboxService } from './moviebox.service.js';
import { TmdbService } from './tmdb.service.js';
import { ApiProcessor } from './apiProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

export class AutoScraperService {
  static instance = null;

  constructor() {
    this.status = 'idle'; // 'idle' | 'running' | 'completed' | 'error'
    this.lastRunTime = null;
    this.nextRunTime = null;
    this.intervalId = null;
    this.initialTimeoutId = null;

    this.stats = {
      totalTitles: 0,
      moviesCount: 0,
      seriesCount: 0,
      shelvesCount: 0,
      lastRunDurationMs: 0,
      lastRunItemsScraped: 0,
      errorsCount: 0,
      lastError: null,
    };

    this.currentProgress = {
      stage: 'idle',
      itemsProcessed: 0,
      totalItemsToProcess: 0,
      percent: 0,
    };

    // In-memory catalog and fast lookups
    this.catalog = {
      featured: null,
      shelves: [],
      totalTitles: 0,
      lastUpdated: null,
    };
    this.itemsById = new Map();
    this.itemsBySlug = new Map();

    // Resolve persistent storage path
    const configuredPath = config.scraper.dataPath || './data/metadata_catalog.json';
    this.filePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(PROJECT_ROOT, configuredPath);
  }

  static getInstance() {
    if (!AutoScraperService.instance) {
      AutoScraperService.instance = new AutoScraperService();
    }
    return AutoScraperService.instance;
  }

  /**
   * Initialize automated scraper daemon on server startup
   */
  async init() {
    try {
      // 1. Ensure storage directory exists
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 2. Load existing persistent catalog from disk for instant availability
      await this.loadFromDisk();

      // 3. Schedule automated scraping background worker
      if (config.scraper.enabled) {
        const delayMs = config.scraper.startDelayMs || 5000;
        logger.info(`🤖 AutoScraperService scheduled: first run in ${delayMs / 1000}s, recurring every ${config.scraper.intervalMinutes}m`);

        this.initialTimeoutId = setTimeout(() => {
          this.startScrapeCycle().catch((err) => {
            logger.error(`AutoScraperService initial run error: ${err.message}`);
          });
        }, delayMs);

        const intervalMs = Math.max(10, config.scraper.intervalMinutes) * 60 * 1000;
        this.nextRunTime = new Date(Date.now() + delayMs).toISOString();

        this.intervalId = setInterval(() => {
          this.startScrapeCycle().catch((err) => {
            logger.error(`AutoScraperService scheduled run error: ${err.message}`);
          });
        }, intervalMs);
      } else {
        logger.info('AutoScraperService is disabled by configuration (SCRAPER_AUTO_START=false)');
      }
    } catch (err) {
      logger.error(`AutoScraperService init error: ${err.message}`, { stack: err.stack });
    }
  }

  /**
   * Graceful stop during server shutdown
   */
  stop() {
    if (this.initialTimeoutId) clearTimeout(this.initialTimeoutId);
    if (this.intervalId) clearInterval(this.intervalId);
    logger.info('AutoScraperService stopped.');
  }

  /**
   * Load saved metadata catalog from disk into memory
   */
  async loadFromDisk() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = await fs.promises.readFile(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.shelves) {
          this.catalog = {
            featured: data.featured || null,
            shelves: data.shelves || [],
            totalTitles: data.totalTitles || 0,
            lastUpdated: data.lastUpdated || null,
          };

          this.itemsById.clear();
          this.itemsBySlug.clear();

          const allItems = data.items || [];
          let mCount = 0;
          let sCount = 0;

          allItems.forEach((item) => {
            this.itemsById.set(String(item.id), item);
            if (item.subjectId) this.itemsById.set(String(item.subjectId), item);
            if (item.slug) this.itemsBySlug.set(String(item.slug), item);
            if (item.mediaType === 'series' || item.type === 'series') sCount++;
            else mCount++;
          });

          // If shelves were empty on disk but items exist, automatically assemble thematic shelves
          if (this.catalog.shelves.length === 0 && allItems.length > 0) {
            this.catalog.shelves = this.assembleShelves(allItems, []);
            this.catalog.featured = allItems.find(
              (i) => i.backdropUrl && i.overview?.length > 40 && (i.rating || 0) >= 7.0
            ) || allItems.find(i => i.backdropUrl) || allItems[0];
            if (this.catalog.featured) this.catalog.featured.featured = true;
          }

          this.stats.totalTitles = this.itemsById.size;
          this.stats.moviesCount = mCount;
          this.stats.seriesCount = sCount;
          this.stats.shelvesCount = this.catalog.shelves.length;
          this.lastRunTime = data.lastUpdated;

          logger.info(`💾 Loaded ${this.itemsById.size} cached titles across ${this.catalog.shelves.length} shelves from ${this.filePath}`);
        }
      }
    } catch (err) {
      logger.warn(`Could not load cached metadata from disk: ${err.message}`);
    }
  }

  /**
   * Atomically save catalog to disk using temporary file
   */
  async saveToDisk() {
    try {
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const items = Array.from(new Set(this.itemsById.values()));
      const payload = {
        featured: this.catalog.featured,
        shelves: this.catalog.shelves,
        totalTitles: items.length,
        lastUpdated: new Date().toISOString(),
        items,
      };

      const tmpPath = `${this.filePath}.tmp`;
      await fs.promises.writeFile(tmpPath, JSON.stringify(payload, null, 2), 'utf-8');
      await fs.promises.rename(tmpPath, this.filePath);

      logger.info(`💾 Atomically saved ${items.length} titles to ${this.filePath}`);
    } catch (err) {
      logger.error(`Failed to save catalog to disk: ${err.message}`);
    }
  }

  /**
   * Main Automated Scraping & Enrichment Pipeline
   */
  async startScrapeCycle({ force = false } = {}) {
    if (this.status === 'running' && !force) {
      logger.info('AutoScraperService already in progress. Skipping trigger.');
      return { status: 'running', message: 'Scraper is already running' };
    }

    const startTime = Date.now();
    this.status = 'running';
    this.currentProgress = {
      stage: 'initiating',
      itemsProcessed: 0,
      totalItemsToProcess: 0,
      percent: 0,
    };

    logger.info('🚀 AutoScraperService: Starting automated metadata crawl & enrichment cycle...');

    try {
      // --- STAGE 1: Discover Catalog Shelves & Raw Content ---
      this.currentProgress.stage = 'crawling_shelves';
      const [homeCatalog, mbTrending, tmdbTrending] = await Promise.allSettled([
        MovieboxService.getHomeCatalog(),
        MovieboxService.getTrending('all', 1, 24),
        TmdbService.getTrending(1).catch(() => ({ results: [] })),
      ]);

      const rawHome = homeCatalog.status === 'fulfilled' ? homeCatalog.value : { rows: [] };
      const rawMbTrend = mbTrending.status === 'fulfilled' ? mbTrending.value : [];
      const rawTmdbTrend = tmdbTrending.status === 'fulfilled' ? tmdbTrending.value?.results || [] : [];

      // --- STAGE 2: Deduplicate Discovered Titles into Priority Queue ---
      this.currentProgress.stage = 'deduplicating';
      const discoveredMap = new Map();

      // Collect from Home Rows
      for (const row of rawHome.rows || []) {
        for (const item of row.items || []) {
          const key = (item.id || item.subjectId || item.title).toString().toLowerCase();
          if (!discoveredMap.has(key)) {
            discoveredMap.set(key, { ...item, sourceCategory: row.title || 'Featured' });
          }
        }
      }

      // Collect from MovieBox Trending
      for (const item of rawMbTrend) {
        const key = (item.id || item.subjectId || item.title).toString().toLowerCase();
        if (!discoveredMap.has(key)) {
          discoveredMap.set(key, { ...item, sourceCategory: 'Trending' });
        }
      }

      // Collect from TMDb Trending (normalize to search on Moviebox)
      for (const item of rawTmdbTrend) {
        if (item.media_type === 'person') continue;
        const title = item.title || item.name || '';
        const key = title.toLowerCase();
        if (title && !discoveredMap.has(key)) {
          const isTv = item.media_type === 'tv' || Boolean(item.first_air_date);
          discoveredMap.set(key, {
            id: String(item.id),
            subjectId: String(item.id),
            title,
            mediaType: isTv ? 'series' : 'movie',
            media_type: isTv ? 'tv' : 'movie',
            release_year: parseInt((item.release_date || item.first_air_date || '2024').slice(0, 4), 10),
            rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : 8.0,
            overview: item.overview || '',
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
            genres: ['Trending'],
            sourceCategory: 'Global Trending',
          });
        }
      }

      const queue = Array.from(discoveredMap.values()).slice(0, config.scraper.maxItems || 80);
      this.currentProgress.totalItemsToProcess = queue.length;
      logger.info(`📦 AutoScraperService: Discovered ${queue.length} target items for deep metadata enrichment.`);

      // --- STAGE 3: Batch Deep Metadata & Stream Enrichment ---
      this.currentProgress.stage = 'enriching_metadata';
      const enrichedItems = [];
      const concurrency = Math.max(1, config.scraper.concurrency || 3);

      for (let i = 0; i < queue.length; i += concurrency) {
        const chunk = queue.slice(i, i + concurrency);
        const results = await Promise.allSettled(
          chunk.map(async (rawItem) => {
            return await this.enrichItem(rawItem);
          })
        );

        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value) {
            enrichedItems.push(res.value);
            this.itemsById.set(String(res.value.id), res.value);
            if (res.value.subjectId) this.itemsById.set(String(res.value.subjectId), res.value);
            if (res.value.slug) this.itemsBySlug.set(String(res.value.slug), res.value);
          }
        });

        this.currentProgress.itemsProcessed = Math.min(i + concurrency, queue.length);
        this.currentProgress.percent = Math.round((this.currentProgress.itemsProcessed / queue.length) * 100);

        // Polite delay to preserve API responsiveness
        await new Promise((r) => setTimeout(r, 250));
      }

      // --- STAGE 4: Build Curated Thematic Shelves ---
      this.currentProgress.stage = 'assembling_shelves';
      const shelves = this.assembleShelves(enrichedItems, rawHome.rows || []);

      // Select high-impact featured hero banner with confirmed 16:9 widescreen movie banner
      let featured = enrichedItems.find(
        (item) => item.backdropUrl && item.backdropUrl.includes('image.tmdb.org') && item.backdropUrl !== item.posterUrl && (item.rating || 0) >= 7.5 && item.overview?.length > 40
      ) || enrichedItems.find(
        (item) => item.backdropUrl && item.backdropUrl.startsWith('http') && item.backdropUrl !== item.posterUrl
      ) || enrichedItems[0] || null;

      if (featured) {
        featured.featured = true;
      }

      this.catalog = {
        featured,
        shelves,
        totalTitles: enrichedItems.length,
        lastUpdated: new Date().toISOString(),
      };

      // --- STAGE 5: Atomic Persistence & Metrics ---
      await this.saveToDisk();

      const durationMs = Date.now() - startTime;
      let movieCount = 0;
      let seriesCount = 0;
      enrichedItems.forEach((i) => {
        if (i.mediaType === 'series' || i.type === 'series') seriesCount++;
        else movieCount++;
      });

      this.stats = {
        totalTitles: enrichedItems.length,
        moviesCount: movieCount,
        seriesCount,
        shelvesCount: shelves.length,
        lastRunDurationMs: durationMs,
        lastRunItemsScraped: enrichedItems.length,
        errorsCount: this.stats.errorsCount,
        lastError: null,
      };

      this.lastRunTime = new Date().toISOString();
      this.nextRunTime = new Date(Date.now() + (config.scraper.intervalMinutes || 360) * 60 * 1000).toISOString();
      this.status = 'completed';
      this.currentProgress.stage = 'completed';
      this.currentProgress.percent = 100;

      logger.info(`✅ AutoScraperService: Completed in ${(durationMs / 1000).toFixed(1)}s! Cached ${enrichedItems.length} titles across ${shelves.length} shelves.`);
      return { status: 'success', totalTitles: enrichedItems.length, durationMs };
    } catch (err) {
      this.status = 'error';
      this.currentProgress.stage = 'failed';
      this.stats.errorsCount++;
      this.stats.lastError = err.message;
      logger.error(`❌ AutoScraperService error: ${err.message}`, { stack: err.stack });
      return { status: 'error', message: err.message };
    }
  }

  /**
   * Deeply enrich a raw item with TMDb metadata, backdrops, cast, seasons/episodes, and stream qualities
   */
  async enrichItem(rawItem) {
    try {
      const id = String(rawItem.id || rawItem.subjectId || '');
      const detailPath = rawItem.detailPath || rawItem.detail_path || id;
      const rawTitle = rawItem.title || rawItem.name || 'Untitled';
      const isTv = rawItem.mediaType === 'series' || rawItem.media_type === 'tv' || rawItem.subjectType === 2 || /tv|season|s1|episodes/i.test(rawTitle);

      // Fetch comprehensive details via MovieboxService (which performs TMDb enrichment and season resolution)
      const details = await MovieboxService.getDetails(id, detailPath, isTv ? 'tv' : 'movie', rawTitle);

      // Normalize to CineVault Movie model
      const releaseYear = details.release_year || rawItem.release_year || 2024;
      const rating = details.rating || rawItem.rating || 8.0;
      const overview = details.overview || rawItem.overview || `Watch ${rawTitle} with high-definition streaming on CineVault.`;
      const poster = details.poster || rawItem.poster || '';
      let backdrop = details.backdrop || rawItem.backdrop || '';

      // Ensure actual 16:9 widescreen movie banner is resolved
      if (!backdrop || backdrop === poster || !backdrop.startsWith('http')) {
        try {
          const cleanSearch = (details.title || rawTitle).replace(/[[\](){}\-_]/g, ' ').trim();
          const searchRes = await TmdbService.searchMovies(cleanSearch, 1);
          const topMatch = searchRes?.results?.find((r) => r.backdrop_path);
          if (topMatch?.backdrop_path) {
            backdrop = `https://image.tmdb.org/t/p/original${topMatch.backdrop_path}`;
          }
        } catch {}
      }

      if (!backdrop) {
        backdrop = poster;
      }

      const mediaType = details.type === 'series' || details.mediaType === 'series' ? 'series' : 'movie';
      const cleanSlug = `${rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;

      // Audio language determination
      const isHindi = /\[Hindi\]|hindi|dubbed/i.test(rawTitle + ' ' + detailPath + ' ' + (details.overview || ''));
      const audioLanguage = isHindi ? 'Hindi / Multi-Audio' : 'Original Audio';

      return {
        _id: id,
        id,
        subjectId: id,
        tmdbId: id,
        title: details.title || rawTitle,
        slug: cleanSlug,
        type: mediaType,
        mediaType,
        releaseYear,
        rating,
        overview,
        description: overview,
        poster,
        posterUrl: poster,
        backdrop,
        backdropUrl: backdrop,
        trailerUrl: details.trailer_url || '',
        genres: details.genres?.length ? details.genres : ['Cinema', 'Popular'],
        duration: details.duration || (mediaType === 'series' ? 'TV Series' : '1h 58m'),
        director: details.director || 'Acclaimed Director',
        cast: details.cast?.length ? details.cast : ['Featured Cast'],
        language: audioLanguage,
        detailPath,
        seasons: details.seasons || [],
        episodes: details.episodes || [],
        scrapedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.debug(`Error enriching item ${rawItem.title || rawItem.id}: ${err.message}`);
      return null;
    }
  }

  /**
   * Categorize items into rich, thematic frontend shelves
   */
  assembleShelves(items, rawHomeRows) {
    const shelves = [];

    // Helper to extract unique items matching filter
    const getSubset = (filterFn, limit = 16) => {
      const matched = [];
      for (const item of items) {
        if (filterFn(item)) {
          matched.push(item);
          if (matched.length >= limit) break;
        }
      }
      return matched;
    };

    // Shelf 1: Trending Now
    const trendingItems = getSubset((i) => i.rating >= 7.0, 16);
    if (trendingItems.length > 0) {
      shelves.push({
        id: 'shelf_trending',
        title: '🔥 Trending Now',
        type: 'all',
        items: trendingItems,
      });
    }

    // Shelf 2: Bollywood & Hindi Hits
    const hindiItems = getSubset((i) => i.language?.includes('Hindi') || (i.genres || []).some((g) => /hindi|bollywood/i.test(g)), 14);
    if (hindiItems.length > 0) {
      shelves.push({
        id: 'shelf_hindi',
        title: '🇮🇳 Bollywood & Hindi Blockbusters',
        type: 'all',
        items: hindiItems,
      });
    }

    // Shelf 3: Popular Web Series & TV Shows
    const seriesItems = getSubset((i) => i.mediaType === 'series', 16);
    if (seriesItems.length > 0) {
      shelves.push({
        id: 'shelf_series',
        title: '📺 Binge-Worthy TV & Web Series',
        type: 'series',
        items: seriesItems,
      });
    }

    // Shelf 4: Blockbuster Movies
    const movieItems = getSubset((i) => i.mediaType === 'movie', 16);
    if (movieItems.length > 0) {
      shelves.push({
        id: 'shelf_movies',
        title: '🎬 Top Blockbuster Movies',
        type: 'movie',
        items: movieItems,
      });
    }

    // Shelf 5: Action & Thrillers
    const actionItems = getSubset((i) => (i.genres || []).some((g) => /action|thriller|adventure/i.test(g)), 14);
    if (actionItems.length > 0) {
      shelves.push({
        id: 'shelf_action',
        title: '⚡ High-Octane Action & Thrillers',
        type: 'all',
        items: actionItems,
      });
    }

    // Shelf 6: Top Rated Masterpieces
    const topRatedItems = getSubset((i) => i.rating >= 8.0, 12);
    if (topRatedItems.length > 0) {
      shelves.push({
        id: 'shelf_top_rated',
        title: '⭐ Critically Acclaimed Masterpieces',
        type: 'all',
        items: topRatedItems,
      });
    }

    // Shelf 7+: Original Home Rows from MovieBox mapped with enriched data
    rawHomeRows.forEach((row, idx) => {
      const mapped = [];
      (row.items || []).forEach((raw) => {
        const enriched = this.itemsById.get(String(raw.id || raw.subjectId));
        if (enriched) mapped.push(enriched);
      });

      if (mapped.length >= 4) {
        shelves.push({
          id: `shelf_curated_${idx}`,
          title: row.title || `Curated Row ${idx + 1}`,
          type: 'all',
          items: mapped.slice(0, 16),
        });
      }
    });

    return shelves;
  }

  /**
   * Fast query for catalog
   */
  getCatalog({ type = 'all', genre = '' } = {}) {
    let shelves = this.catalog.shelves;
    if (type !== 'all') {
      shelves = shelves.map((s) => ({
        ...s,
        items: s.items.filter((i) => i.mediaType === type),
      })).filter((s) => s.items.length > 0);
    }

    if (genre && genre !== 'all') {
      const gLower = genre.toLowerCase();
      shelves = shelves.map((s) => ({
        ...s,
        items: s.items.filter((i) => (i.genres || []).some((g) => g.toLowerCase().includes(gLower))),
      })).filter((s) => s.items.length > 0);
    }

    return {
      status: 'success',
      featured: this.catalog.featured,
      shelves,
      totalTitles: this.stats.totalTitles,
      lastUpdated: this.catalog.lastUpdated,
    };
  }

  /**
   * Fast O(1) retrieval for single item by ID or Slug
   */
  getItemById(id) {
    if (!id) return null;
    const strId = String(id).trim();
    return this.itemsById.get(strId) || this.itemsBySlug.get(strId) || null;
  }

  /**
   * Check whether pre-scraped catalog is populated
   */
  hasCatalog() {
    return this.itemsById.size > 0 && this.catalog.shelves.length > 0;
  }

  /**
   * Scraper Health & Telemetry Status
   */
  getStatus() {
    return {
      status: this.status,
      enabled: config.scraper.enabled,
      intervalMinutes: config.scraper.intervalMinutes,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      progress: this.currentProgress,
      statistics: this.stats,
      dataPath: this.filePath,
    };
  }
}
