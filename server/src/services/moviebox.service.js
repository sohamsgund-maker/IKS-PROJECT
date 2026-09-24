import axios from 'axios';
import { logger } from '../utils/logger.js';
import { TmdbService } from './tmdb.service.js';
import { config } from '../config/env.js';

const MOVIEBOX_API_BASE = 'https://h5-api.aoneroom.com';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'Origin': 'https://h5.aoneroom.com',
  'Referer': 'https://h5.aoneroom.com/',
};

export class MovieboxService {
  static formatItem(raw, defaultMediaType = 'movie') {
    const subId = String(raw.subjectId || raw.id || '');
    const title = String(raw.title || raw.postTitle || 'Untitled');
    const postTitle = String(raw.postTitle || title);
    const detailPath = String(raw.detailPath || '');

    const subType = raw.subjectType;
    let mediaType = defaultMediaType;
    if (subType === 2) mediaType = 'tv';
    else if (subType === 1) mediaType = 'movie';
    else if (/tv|season|s1|s2/i.test(title)) mediaType = 'tv';

    const relDate = String(raw.releaseDate || '');
    const yearMatch = relDate.match(/\b(19\d\d|20\d\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2024;
    const rating = parseFloat(raw.imdbRatingValue || raw.rating || 7.8);
    const poster = raw.cover?.url || raw.cover || '';
    const backdrop = raw.stills?.url || raw.stills || poster;
    const trailerUrl = raw.trailer?.videoAddress?.url || '';

    return {
      id: subId,
      subjectId: subId,
      title,
      post_title: postTitle,
      detail_path: detailPath,
      detailPath,
      media_type: mediaType,
      mediaType,
      release_year: year,
      rating,
      overview: raw.description || `Watch ${title} online directly on CineVault with high-speed multi-server streaming.`,
      poster,
      backdrop,
      genres: raw.genre ? raw.genre.split(',').map((g) => g.trim()) : ['Cinema'],
      trailer_url: trailerUrl,
      audio: /\[Hindi\]|hindi/i.test(title + ' ' + detailPath) ? 'Hindi / Multi-Audio' : 'Original Audio',
    };
  }

  static _searchCache = new Map();

  /**
   * Real-time search from MovieBox H5 API
   */
  static async search(query, page = 1, size = 20, mediaType = 'all') {
    if (!query || !query.trim()) return [];
    const cacheKey = `${query.trim().toLowerCase()}_${page}_${size}_${mediaType}`;
    const cached = this._searchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 300000) {
      return cached.data;
    }

    try {
      const typeCode = mediaType === 'movie' ? 1 : mediaType === 'tv' ? 2 : 0;
      const response = await axios.post(
        `${MOVIEBOX_API_BASE}/wefeed-h5api-bff/subject/search`,
        {
          keyword: query.trim(),
          page,
          perPage: size,
          subjectType: typeCode,
        },
        {
          headers: DEFAULT_HEADERS,
          timeout: 6000,
        }
      );

      const items = response.data?.data?.items || [];
      const formatted = items.map((item) => this.formatItem(item, mediaType === 'tv' ? 'tv' : 'movie'));
      this._searchCache.set(cacheKey, { data: formatted, ts: Date.now() });
      return formatted;
    } catch (error) {
      logger.debug(`MovieBox search error for "${query}": ${error.message}`);
      return [];
    }
  }

  /**
   * Trending titles from MovieBox
   */
  static async getTrending(mediaType = 'all', page = 1, perPage = 24) {
    try {
      const response = await axios.get(
        `${MOVIEBOX_API_BASE}/wefeed-h5api-bff/subject/trending`,
        {
          params: { page, perPage },
          headers: DEFAULT_HEADERS,
          timeout: 6000,
        }
      );

      const list = response.data?.data?.subjectList || [];
      const items = list.map((item) => this.formatItem(item));
      return mediaType === 'all' ? items : items.filter((i) => i.media_type === mediaType);
    } catch (error) {
      logger.debug(`MovieBox getTrending error: ${error.message}`);
      return [];
    }
  }

  /**
   * Real-time Home Catalog shelves
   */
  static async getHomeCatalog() {
    try {
      const response = await axios.get(`${MOVIEBOX_API_BASE}/wefeed-h5api-bff/home`, {
        headers: DEFAULT_HEADERS,
        timeout: 8000,
      });

      const opList = response.data?.data?.operatingList || [];
      const rows = [];
      let featured = null;

      opList.forEach((op, idx) => {
        if (!op.subjects || op.subjects.length === 0) return;
        const items = op.subjects.map((item) => this.formatItem(item));
        if (!featured && items[0]?.backdrop) featured = items[0];

        rows.push({
          id: `row_${idx}`,
          title: op.title || `Row ${idx + 1}`,
          items,
        });
      });

      if (!featured && rows[0]?.items) featured = rows[0].items[0];

      // Enrich featured item with high-res cinematic backdrop banner and overview from TMDb
      if (featured) {
        try {
          const tmdbRes = await TmdbService.searchMovies(featured.title);
          const match = tmdbRes?.results?.find((r) => r.backdrop_path || r.overview);
          if (match) {
            if (match.backdrop_path) {
              featured.backdrop = `https://image.tmdb.org/t/p/original${match.backdrop_path}`;
            }
            if (match.overview && (!featured.overview || featured.overview.length < 20)) {
              featured.overview = match.overview;
            }
          }
        } catch {}
      }

      return {
        status: 'success',
        featured,
        rows,
        total_titles: rows.reduce((acc, r) => acc + r.items.length, 0),
      };
    } catch (error) {
      logger.debug(`MovieBox getHomeCatalog error: ${error.message}`);
      return { status: 'error', featured: null, rows: [], total_titles: 0 };
    }
  }

  /**
   * Search suggestions autocomplete from MovieBox
   */
  static async getSuggestions(query, perPage = 8) {
    if (!query || !query.trim()) return [];
    try {
      const response = await axios.post(
        `${MOVIEBOX_API_BASE}/wefeed-h5api-bff/subject/search-suggest`,
        {
          keyword: query.trim(),
          perPage,
        },
        {
          headers: DEFAULT_HEADERS,
          timeout: 4000,
        }
      );

      const items = response.data?.data?.items || [];
      return items.map((i) => i.word).filter(Boolean);
    } catch (error) {
      logger.debug(`MovieBox getSuggestions error: ${error.message}`);
      return [];
    }
  }

  // --- MovieBox Direct CDN Playback & Stream Scraping Engine ---

  static _tokenCache = { token: '', xUser: '', expiresAt: 0 };
  static _domainCache = { domain: 'https://mzfi.me', expiresAt: 0 };
  static _streamsCache = new Map();

  /**
   * Retrieve live guest JWT token and x-user header from MovieBox H5 API
   */
  static async getMovieboxToken() {
    const now = Date.now();
    if (this._tokenCache.token && now < this._tokenCache.expiresAt) {
      return { token: this._tokenCache.token, xUser: this._tokenCache.xUser };
    }

    try {
      const res = await fetch(`${MOVIEBOX_API_BASE}/wefeed-h5api-bff/home?host=moviebox.ph`, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(6000),
      });
      const xUser = res.headers.get('x-user') || '';
      let token = '';
      if (xUser) {
        try {
          const parsed = JSON.parse(xUser);
          token = parsed.token || '';
        } catch {}
      }
      if (token) {
        this._tokenCache = { token, xUser, expiresAt: now + 3600 * 1000 };
        return { token, xUser };
      }
    } catch (err) {
      logger.debug(`MovieBox token fetch error: ${err.message}`);
    }
    return { token: this._tokenCache.token, xUser: this._tokenCache.xUser };
  }

  /**
   * Get active MovieBox media player domain (e.g. https://mzfi.me)
   */
  static async getMovieboxPlayerDomain() {
    const now = Date.now();
    if (this._domainCache.domain && now < this._domainCache.expiresAt) {
      return this._domainCache.domain;
    }

    try {
      const res = await fetch(`${MOVIEBOX_API_BASE}/wefeed-h5api-bff/media-player/get-domain`, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      if (data?.data && typeof data.data === 'string') {
        const clean = data.data.replace(/\/+$/, '');
        this._domainCache = { domain: clean, expiresAt: now + 3600 * 1000 };
        return clean;
      }
    } catch {}
    return this._domainCache.domain || 'https://mzfi.me';
  }

  /**
   * Call MovieBox's official subject/play endpoint to get 100% direct CDN MP4 streams
   */
  static async getPlayResource(subjectId, detailPath, mediaType = 'movie', season = 1, episode = 1) {
    const { token, xUser } = await this.getMovieboxToken();
    const domain = await this.getMovieboxPlayerDomain();

    const isEpSpecified = Number(episode) > 0 || Number(season) > 1;
    const reqSe = isEpSpecified ? Math.max(1, Number(season) || 1) : (mediaType === 'movie' ? 0 : Math.max(1, season));
    const reqEp = isEpSpecified ? Math.max(1, Number(episode) || 1) : (mediaType === 'movie' ? 0 : Math.max(1, episode));
    const attempts = [[reqSe, reqEp]];
    const alt = reqSe === 0 && reqEp === 0 ? [1, 1] : [0, 0];
    attempts.push(alt);

    let webPlayerUrl = `${domain}/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${reqSe}&detailEp=${reqEp}&lang=en`;
    const streams = [];

    for (const [attemptSe, attemptEp] of attempts) {
      const currentWebUrl = `${domain}/spa/videoPlayPage/movies/${detailPath}?id=${subjectId}&type=/movie/detail&detailSe=${attemptSe}&detailEp=${attemptEp}&lang=en`;
      const playUrl = `${domain}/wefeed-h5api-bff/subject/play?subjectId=${subjectId}&se=${attemptSe}&ep=${attemptEp}&detailPath=${detailPath}`;

      const headers = {
        'User-Agent': DEFAULT_HEADERS['User-Agent'],
        Referer: currentWebUrl,
        Origin: domain,
        token,
        'x-user': typeof xUser === 'object' ? JSON.stringify(xUser) : xUser,
      };

      try {
        const res = await fetch(playUrl, { headers, signal: AbortSignal.timeout(7000) });
        const json = await res.json();
        const rawStreams = json?.data?.streams || [];

        if (Array.isArray(rawStreams) && rawStreams.length > 0) {
          webPlayerUrl = currentWebUrl;
          for (const s of rawStreams) {
            const resLabel = String(s.resolutions || '720');
            const sizeBytes = Number(s.size || 0);
            const sizeMb = sizeBytes ? Number((sizeBytes / (1024 * 1024)).toFixed(1)) : 0;
            streams.push({
              id: String(s.id || ''),
              resolution: `${resLabel}p`,
              resNum: parseInt(resLabel, 10) || 720,
              format: s.format || 'MP4',
              sizeMb,
              duration: s.duration || 0,
              url: s.url || '',
            });
          }
          break;
        }
      } catch (err) {
        logger.debug(`MovieBox play attempt failed (${attemptSe}, ${attemptEp}): ${err.message}`);
      }
    }

    // Sort streams highest resolution first (1080p, 720p, 480p, 360p)
    streams.sort((a, b) => b.resNum - a.resNum);

    return {
      webPlayerUrl,
      streams,
    };
  }

  static extractSequelToken(title) {
    const s = ' ' + (title || '').toLowerCase().replace(/[^a-z0-9]/g, ' ') + ' ';
    if (/\b(?:part|chapter|season|vol|volume)\s*(?:2|two|ii)\b|\b(?:2|ii)\b/.test(s)) return '2';
    if (/\b(?:part|chapter|season|vol|volume)\s*(?:3|three|iii)\b|\b(?:3|iii)\b/.test(s)) return '3';
    if (/\b(?:part|chapter|season|vol|volume)\s*(?:4|four|iv)\b|\b(?:4|iv)\b/.test(s)) return '4';
    if (/\b(?:part|chapter|season|vol|volume)\s*(?:5|five|v)\b|\b(?:5|v)\b/.test(s)) return '5';
    if (/\b(?:part|chapter|season|vol|volume)\s*(?:1|one|i)\b|\b(?:1|i)\b/.test(s)) return '1';
    return null;
  }

  static isTitleMatch(query, candidate) {
    if (!query || !candidate) return false;
    const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const qClean = cleanStr(query);
    const cClean = cleanStr(candidate);
    if (qClean === cClean) return true;

    // Sequel / Part check: strict validation
    const qToken = MovieboxService.extractSequelToken(query);
    const cToken = MovieboxService.extractSequelToken(candidate);

    if (qToken) {
      if (!cToken || cToken !== qToken) {
        return false; // If query is looking for Part 2, DO NOT match Part 1 or non-sequel!
      }
    } else if (cToken && cToken !== '1') {
      // Query did NOT ask for a sequel, so do not match Part 2/3
      return false;
    }

    // Word overlap comparison
    const stopWords = new Set(['the', 'and', 'part', 'chapter', 'movie', 'full', 'hindi', 'dubbed', 'watch', 'online']);
    const qWords = qClean.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
    const cWords = new Set(cClean.split(' ').filter(w => w.length > 2 && !stopWords.has(w)));

    if (qWords.length === 0) return true;
    const overlap = qWords.filter(w => cWords.has(w)).length;
    return (overlap / qWords.length) >= 0.6;
  }

  static findBestTitleMatch(query, items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    const cleanQuery = (query || '').replace(/\s*\(\d{4}\)|\s*\[.*?\]/gi, '').trim();
    if (!cleanQuery) return items[0];

    // 1. Try strict sequel & word overlap match
    const matched = items.find(r => MovieboxService.isTitleMatch(cleanQuery, r.title || r.post_title || r.detailPath || r.detail_path));
    if (matched) return matched;

    // 2. Score candidate items if no exact match found
    const qToken = MovieboxService.extractSequelToken(cleanQuery);
    let bestCandidate = null;
    let highestScore = -1;

    for (const item of items) {
      const candidateTitle = item.title || item.post_title || item.detailPath || item.detail_path || '';
      const cToken = MovieboxService.extractSequelToken(candidateTitle);

      // Severe penalty if sequel token mismatches
      if (qToken && cToken && qToken !== cToken) continue;
      if (qToken && !cToken) continue;
      if (!qToken && cToken && cToken !== '1') continue;

      const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
      const qWords = cleanStr(cleanQuery).split(' ').filter(w => w.length > 2);
      const cWords = new Set(cleanStr(candidateTitle).split(' ').filter(w => w.length > 2));
      const overlap = qWords.filter(w => cWords.has(w)).length;
      const score = qWords.length > 0 ? (overlap / qWords.length) : 0;

      if (score > highestScore && score >= 0.5) {
        highestScore = score;
        bestCandidate = item;
      }
    }

    return bestCandidate;
  }

  /**
   * Resolve ready-to-stream MovieBox Direct CDN MP4 streams
   */
  static async getStreams(id, mediaType = 'movie', season = 1, episode = 1, detailPath = '', title = '') {
    let strId = String(id || '');
    let resolvedPath = detailPath || '';

    // Only search MovieBox if resolvedPath is missing or purely numeric
    // (Preserve authentic non-numeric detailPath slugs with 100% fidelity)
    if (!resolvedPath || /^\d+$/.test(resolvedPath)) {
      const searchKey = title ? title.replace(/\s*\(\d{4}\)|\s*\[.*?\]/gi, '').trim() : '';
      if (searchKey) {
        try {
          const results = await this.search(searchKey, 1, 5, mediaType);
          if (results.length > 0) {
            const matchedItem = MovieboxService.findBestTitleMatch(searchKey, results);
            if (matchedItem) {
              strId = matchedItem.id || matchedItem.subjectId || strId;
              resolvedPath = matchedItem.detailPath || matchedItem.detail_path || resolvedPath;
            }
          }
        } catch {}
      }
    }

    if (!resolvedPath) resolvedPath = strId;

    const cacheKey = `mb_streams_${strId}_${mediaType}_s${season}_e${episode}_${resolvedPath}_${title || ''}`;
    const cached = this._streamsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 900000 && cached.data?.streams?.length > 0) {
      return cached.data;
    }

    const isEpSpecified = Number(episode) > 0 || Number(season) > 1;
    const playRes = await this.getPlayResource(strId, resolvedPath, isEpSpecified ? 'tv' : mediaType, season, episode);
    const sortedCdn = playRes.streams || [];
    const webPlayerUrl = playRes.webPlayerUrl;

    const servers = [];
    const qualities = [];

    sortedCdn.forEach((s) => {
      const sizeStr = s.sizeMb ? ` (${s.sizeMb} MB)` : '';
      const srvName = `⚡ CineVault Ultra Direct ${s.resolution} (Fast MP4)`;
      const proxyUrl = `/api/proxy_video?url=${encodeURIComponent(s.url)}`;

      servers.push({
        server_id: `moviebox_direct_${s.resolution}`,
        serverId: `moviebox_direct_${s.resolution}`,
        server_name: srvName,
        serverName: srvName,
        quality: `${s.resolution} Direct${sizeStr}`,
        is_embed: false,
        isEmbed: false,
        is_direct: true,
        isDirect: true,
        url: proxyUrl,
        cdn_url: s.url,
        cdnUrl: s.url,
      });

      qualities.push({
        quality: s.resolution,
        videoUrl: proxyUrl,
        downloadUrl: s.url,
        cdnUrl: s.url,
        fileSize: s.sizeMb ? `${s.sizeMb} MB` : '1.2 GB',
      });
    });

    // Fallback if no streams found directly
    if (servers.length === 0) {
      servers.push({
        server_id: 'moviebox_direct',
        serverId: 'moviebox_direct',
        server_name: '⚡ CineVault Ultra Direct (Fast MP4)',
        serverName: '⚡ CineVault Ultra Direct (Fast MP4)',
        badge: '⚡ Ultra Dedicated',
        quality: 'Direct HD',
        is_embed: false,
        isEmbed: false,
        is_direct: true,
        isDirect: true,
        url: '',
        cdn_url: '',
      });
    }

    const storedFutureServers = [];

    const primaryUrl = servers[0]?.url || '';

    const result = {
      id: strId,
      subjectId: strId,
      detail_path: resolvedPath,
      detailPath: resolvedPath,
      media_type: mediaType,
      mediaType,
      season: mediaType === 'tv' ? season : null,
      episode: mediaType === 'tv' ? episode : null,
      direct_stream: primaryUrl,
      directStream: primaryUrl,
      cdn_stream_url: sortedCdn[0]?.url || '',
      total_servers: servers.length,
      totalServers: servers.length,
      primary_stream: primaryUrl,
      primaryStream: primaryUrl,
      qualities,
      servers,
      stored_future_servers: storedFutureServers,
      web_player_url: webPlayerUrl,
      webPlayerUrl,
    };

    if (qualities.length > 0) {
      this._streamsCache.set(cacheKey, { data: result, ts: Date.now() });
    }

    return result;
  }

  /**
   * Helper for MovieController.getStreams: provides upstream MovieBox play info
   */
  static async getPlayInfo(subjectId, detailPath = '', mediaType = 'movie', season = 1, episode = 1) {
    try {
      const streams = await this.getStreams(subjectId, mediaType, season, episode, detailPath);
      return {
        qualities: streams.qualities,
        directStreamUrl: streams.direct_stream,
        servers: streams.servers,
        storedFutureServers: streams.stored_future_servers,
      };
    } catch {
      return null;
    }
  }

  static cleanTitleForSearch(title = '', detailPath = '') {
    const raw = String(title || detailPath || '');
    return raw
      .replace(/^Trailer[-:\s]+/i, '')
      .replace(/^Download\s+/i, '')
      .replace(/\[Hindi\]/gi, '')
      .replace(/\b(Hindi|English|Telugu|Tamil|Dubbed|Multi-Audio)\b/gi, '')
      .replace(/\bS\d+[-–\s]*S\d+\b/gi, '')
      .replace(/\bS\d+\b/gi, '')
      .replace(/\bSeason\s*\d+\b/gi, '')
      .replace(/\b(1080p|720p|480p|4k|uhd|hd|sd)\b/gi, '')
      .replace(/[-_][a-zA-Z0-9]{8,}$/, '')
      .replace(/\b(19\d\d|20\d\d)\b/g, '')
      .replace(/[[\](){}\-_.:|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static _detailsCache = new Map();

  /**
   * Get rich MovieBox details, synopsis, seasons, episodes, cast, and high-res backdrops
   */
  static async getDetails(itemId, detailPath = '', mediaType = 'movie', title = '') {
    const strId = String(itemId || '').trim();
    const cacheKey = `mb_details_${strId}_${detailPath || ''}_${title || ''}`;
    const cached = this._detailsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 300000) {
      return cached.data;
    }

    const cleanQuery = MovieboxService.cleanTitleForSearch(title, detailPath || strId);

    let details = {
      id: strId,
      subjectId: strId,
      detail_path: detailPath || strId,
      detailPath: detailPath || strId,
      title: title || strId,
      media_type: mediaType,
      mediaType: mediaType === 'tv' || mediaType === 'series' ? 'series' : 'movie',
      type: mediaType === 'tv' || mediaType === 'series' ? 'series' : 'movie',
      release_year: 2024,
      rating: 8.0,
      overview: 'Directly streaming from MovieBox with high-speed multi-server support.',
      poster: '',
      backdrop: '',
      genres: ['Cinema', 'Trending'],
      duration: mediaType === 'tv' || mediaType === 'series' ? '45 min/ep' : '120 min',
      director: 'Acclaimed Director',
      cast: ['Featured Cast'],
      trailer_url: '',
      direct_stream: '',
      seasons: [],
      episodes: [],
    };

    // 1. Try python moviebox_scraper.py details execution first if available
    try {
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);
      const targetArg = detailPath || strId;
      const { stdout } = await execFileAsync('python', ['moviebox_scraper.py', 'details', targetArg], {
        timeout: 4000,
      });
      const parsed = JSON.parse(stdout);
      if (parsed && (parsed.title || parsed.id)) {
        if (parsed.title && !title) details.title = parsed.title;
        if (parsed.poster) details.poster = parsed.poster;
        if (parsed.backdrop) details.backdrop = parsed.backdrop;
        if (parsed.overview && parsed.overview.length > 20) details.overview = parsed.overview;
        if (parsed.rating) details.rating = parsed.rating;
        if (parsed.release_year) details.release_year = parsed.release_year;
        if (parsed.genres?.length) details.genres = parsed.genres;
        if (parsed.seasons?.length) details.seasons = parsed.seasons;
      }
    } catch {}

    // 2. High-Res TMDb Enrichment: 16:9 Backdrop Banner, Full Synopsis, Real Seasons & Episodes
    try {
      const searchRes = await TmdbService.searchMovies(cleanQuery || details.title || strId);
      const results = searchRes?.results || [];
      const match = results.find((r) => r.backdrop_path || r.overview) || results[0];

      if (match) {
        if (match.title || match.name) details.title = match.title || match.name;
        if (match.backdrop_path) {
          details.backdrop = `https://image.tmdb.org/t/p/original${match.backdrop_path}`;
        }
        if (match.poster_path && !details.poster) {
          details.poster = `https://image.tmdb.org/t/p/w500${match.poster_path}`;
        }
        if (match.overview) {
          details.overview = match.overview;
        }
        if (match.vote_average) {
          details.rating = Math.round(match.vote_average * 10) / 10;
        }
        const relYear = (match.release_date || match.first_air_date || '').split('-')[0];
        if (relYear) details.release_year = parseInt(relYear, 10);

        const isTv = match.media_type === 'tv' ||
          Boolean(match.first_air_date) ||
          details.media_type === 'tv' ||
          details.type === 'series' ||
          /tv|series|season|s1|episodes/i.test(title + ' ' + detailPath + ' ' + (match.name || ''));

        if (isTv) {
          details.media_type = 'tv';
          details.mediaType = 'series';
          details.type = 'series';

          try {
            const tvDetails = await TmdbService.getMovieDetails(match.id, 'tv');
            if (tvDetails) {
              if (tvDetails.backdrop_path) {
                details.backdrop = `https://image.tmdb.org/t/p/original${tvDetails.backdrop_path}`;
              } else if (tvDetails.images?.backdrops?.length > 0) {
                details.backdrop = `https://image.tmdb.org/t/p/original${tvDetails.images.backdrops[0].file_path}`;
              }
              if (tvDetails.poster_path && (!details.poster || details.poster.includes('unsplash'))) {
                details.poster = `https://image.tmdb.org/t/p/w500${tvDetails.poster_path}`;
              }
              if (tvDetails.overview && (!details.overview || details.overview.length < 30)) {
                details.overview = tvDetails.overview;
              }
              if (tvDetails.credits?.cast?.length) {
                details.cast = tvDetails.credits.cast.slice(0, 8).map((c) => c.name);
              }
              if (tvDetails.credits?.crew?.length) {
                const dir = tvDetails.credits.crew.find((c) => c.job === 'Director' || c.department === 'Directing');
                if (dir) details.director = dir.name;
              }
              if (tvDetails.genres?.length) {
                details.genres = tvDetails.genres.map((g) => g.name);
              }

              const validSeasons = (tvDetails.seasons || []).filter((s) => s.season_number > 0);
              const builtSeasons = [];

              for (const s of validSeasons) {
                let episodes = [];
                try {
                  const sRes = await fetch(
                    `https://api.themoviedb.org/3/tv/${match.id}/season/${s.season_number}?api_key=${config.tmdb.apiKey}`,
                    { signal: AbortSignal.timeout(4000) }
                  );
                  if (sRes.ok) {
                    const sJson = await sRes.json();
                    episodes = (sJson.episodes || []).map((ep) => ({
                      season: s.season_number,
                      episode: ep.episode_number,
                      title: ep.name || `Episode ${ep.episode_number}`,
                      duration: ep.runtime ? `${ep.runtime}m` : '45m',
                      overview: ep.overview || '',
                      thumbnailUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : (details.backdrop || details.poster),
                    }));
                  }
                } catch {}

                if (episodes.length === 0) {
                  const epCount = s.episode_count || 10;
                  for (let i = 1; i <= epCount; i++) {
                    episodes.push({
                      season: s.season_number,
                      episode: i,
                      title: `Episode ${i}`,
                      duration: '45m',
                      overview: `${details.title} Season ${s.season_number} Episode ${i}`,
                      thumbnailUrl: details.backdrop || details.poster,
                    });
                  }
                }

                builtSeasons.push({
                  season_number: s.season_number,
                  seasonNumber: s.season_number,
                  name: s.name || `Season ${s.season_number}`,
                  episode_count: episodes.length,
                  overview: s.overview || '',
                  poster_path: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : details.poster,
                  episodes,
                });
              }

              if (builtSeasons.length > 0) {
                details.seasons = builtSeasons;
                details.episodes = builtSeasons[0].episodes;
              }
            }
          } catch {}
        } else {
          // Movie enrichment
          try {
            const movieDetails = await TmdbService.getMovieDetails(match.id, 'movie');
            if (movieDetails) {
              if (movieDetails.backdrop_path) {
                details.backdrop = `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`;
              } else if (movieDetails.images?.backdrops?.length > 0) {
                details.backdrop = `https://image.tmdb.org/t/p/original${movieDetails.images.backdrops[0].file_path}`;
              }
              if (movieDetails.poster_path && (!details.poster || details.poster.includes('unsplash'))) {
                details.poster = `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`;
              }
              if (movieDetails.overview && (!details.overview || details.overview.length < 30)) {
                details.overview = movieDetails.overview;
              }
              if (movieDetails.runtime) {
                const hrs = Math.floor(movieDetails.runtime / 60);
                const mins = movieDetails.runtime % 60;
                details.duration = `${hrs}h ${mins}m`;
              }
              if (movieDetails.credits?.cast?.length) {
                details.cast = movieDetails.credits.cast.slice(0, 8).map((c) => c.name);
              }
              if (movieDetails.credits?.crew?.length) {
                const dir = movieDetails.credits.crew.find((c) => c.job === 'Director' || c.department === 'Directing');
                if (dir) details.director = dir.name;
              }
              if (movieDetails.genres?.length) {
                details.genres = movieDetails.genres.map((g) => g.name);
              }
            }
          } catch {}
        }
      }
    } catch {}

    // 3. Fallback for TV shows / Serials with episodes not on TMDb (e.g. drama serials with 44 episodes like Raj Tilak)
    const isSeriesCheck = details.type === 'series' || details.media_type === 'tv' || /tv|season|s1|episodes/i.test(title + ' ' + detailPath);
    if (isSeriesCheck && details.seasons.length === 0) {
      const epMatch = (title + ' ' + detailPath).match(/\b(\d+)\s*(?:eps?|episodes?)\b/i);
      const epCount = epMatch ? parseInt(epMatch[1], 10) : 44; // Default to 44 for full serial runs like Raj Tilak
      const episodes = [];
      for (let i = 1; i <= epCount; i++) {
        episodes.push({
          season: 1,
          episode: i,
          title: `Episode ${i}`,
          duration: '45m',
          overview: `Watch ${details.title} Episode ${i} directly with high-definition multi-server streaming.`,
          thumbnailUrl: details.backdrop || details.poster,
        });
      }
      details.type = 'series';
      details.mediaType = 'series';
      details.media_type = 'tv';
      details.seasons = [
        {
          season_number: 1,
          seasonNumber: 1,
          name: 'Season 1',
          episode_count: epCount,
          episodes,
        },
      ];
      details.episodes = episodes;
    }

    this._detailsCache.set(cacheKey, { data: details, ts: Date.now() });
    return details;
  }

  /**
   * Filter content by genre from live MovieBox home rows
   */
  static async getByGenre(genre, mediaType = 'all') {
    const catalog = await this.getHomeCatalog();
    const rows = catalog?.rows || [];
    const gLower = String(genre).toLowerCase().trim();
    const matched = [];
    const seen = new Set();

    for (const r of rows) {
      const rTitle = String(r.title || '').toLowerCase();
      if (rTitle.includes(gLower) || gLower === 'all') {
        for (const item of r.items || []) {
          if (!seen.has(item.id)) {
            if (mediaType === 'all' || item.media_type === mediaType) {
              seen.add(item.id);
              matched.push(item);
            }
          }
        }
      }
    }

    if (matched.length === 0) {
      return this.search(genre, 1, 24, mediaType);
    }
    return matched;
  }
}
