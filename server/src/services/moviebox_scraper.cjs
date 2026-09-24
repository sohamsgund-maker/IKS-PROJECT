/**
 * MovieBox Scraper & Multi-Server Video Streaming Engine (Node.js)
 * Collects content directly from live MovieBox endpoints (h5-api.aoneroom.com / h5.aoneroom.com)
 */

const https = require('https');

const MOVIEBOX_API_BASE = 'https://h5-api.aoneroom.com';
const MOVIEBOX_DOMAIN = 'https://mzfi.me';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  'Origin': 'https://h5.aoneroom.com',
  'Referer': 'https://h5.aoneroom.com/'
};

function request(url, options = {}) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const postData = options.body ? JSON.stringify(options.body) : null;
    const reqHeaders = Object.assign({}, DEFAULT_HEADERS, options.headers || {});
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request({
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: options.method || (postData ? 'POST' : 'GET'),
      headers: reqHeaders,
      timeout: options.timeout || 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    if (postData) req.write(postData);
    req.end();
  });
}

function formatMovieBoxItem(raw) {
  const subId = String(raw.subjectId || raw.id || '');
  const title = String(raw.title || raw.postTitle || 'Untitled');
  const postTitle = String(raw.postTitle || title);
  const detailPath = String(raw.detailPath || '');
  const mediaType = raw.subjectType === 2 ? 'tv' : 'movie';
  const relDate = String(raw.releaseDate || '');
  const yearMatch = relDate.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2024;
  const rating = parseFloat(raw.imdbRatingValue || raw.rating || 7.8);
  const poster = raw.cover?.url || raw.cover || '';
  const backdrop = raw.stills?.url || poster;
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
    overview: raw.description || `Watch ${title} online on CineVault.`,
    poster,
    backdrop,
    genres: raw.genre ? raw.genre.split(',').map(g => g.trim()) : ['Cinema'],
    trailer_url: trailerUrl
  };
}

async function getHomeCatalog() {
  const data = await request(`${MOVIEBOX_API_BASE}/wefeed-h5api-bff/home`);
  if (!data || data.code !== 0 || !data.data) return { rows: [], total_titles: 0 };

  const opList = data.data.operatingList || [];
  const rows = [];
  let featured = null;

  opList.forEach((op, idx) => {
    if (!op.subjects || op.subjects.length === 0) return;
    const items = op.subjects.map(formatMovieBoxItem);
    if (!featured && items[0]?.backdrop) featured = items[0];

    rows.push({
      id: `row_${idx}`,
      title: op.title || `Row ${idx + 1}`,
      items
    });
  });

  if (!featured && rows[0]?.items) featured = rows[0].items[0];

  return {
    status: 'success',
    featured,
    rows,
    total_titles: rows.reduce((acc, r) => acc + r.items.length, 0)
  };
}

async function search(query, page = 1, perPage = 24, mediaType = 'all') {
  if (!query || !query.trim()) return [];
  const typeCode = mediaType === 'movie' ? 1 : mediaType === 'tv' ? 2 : 0;
  const res = await request(`${MOVIEBOX_API_BASE}/wefeed-h5api-bff/subject/search`, {
    method: 'POST',
    body: {
      keyword: query.trim(),
      page,
      perPage,
      subjectType: typeCode
    }
  });

  if (!res || res.code !== 0 || !res.data?.items) return [];
  return res.data.items.map(formatMovieBoxItem);
}

async function getTrending(mediaType = 'all', page = 1, perPage = 24) {
  const res = await request(`${MOVIEBOX_API_BASE}/wefeed-h5api-bff/subject/trending?page=${page}&perPage=${perPage}`);
  if (!res || res.code !== 0 || !res.data?.subjectList) return [];
  const items = res.data.subjectList.map(formatMovieBoxItem);
  return mediaType === 'all' ? items : items.filter(i => i.media_type === mediaType);
}

function getStreams(id, mediaType = 'movie', season = 1, episode = 1, detailPath = '') {
  const strId = String(id);
  const se = mediaType === 'movie' ? 0 : season;
  const ep = mediaType === 'movie' ? 0 : episode;
  const dPath = detailPath || strId;
  const webPlayerUrl = `${MOVIEBOX_DOMAIN}/spa/videoPlayPage/movies/${dPath}?id=${strId}&type=/movie/detail&detailSe=${se}&detailEp=${ep}&lang=en`;
  const iframeHtml = `<iframe src="${webPlayerUrl}" width="100%" height="100%" frameborder="0" allowfullscreen="true" scrolling="no" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"></iframe>`;

  const proxyUrl = `/api/proxy_video?url=${encodeURIComponent(webPlayerUrl)}`;
  const servers = [
    {
      server_id: 'moviebox_direct',
      serverId: 'moviebox_direct',
      server_name: '⚡ CineVault Ultra Direct 1080p (Fast MP4)',
      serverName: '⚡ CineVault Ultra Direct 1080p (Fast MP4)',
      quality: '1080p Direct',
      is_direct: true,
      isDirect: true,
      url: proxyUrl
    }
  ];

  return {
    id: strId,
    subjectId: strId,
    detail_path: dPath,
    media_type: mediaType,
    mediaType,
    season: mediaType === 'tv' ? season : null,
    episode: mediaType === 'tv' ? episode : null,
    web_player_url: webPlayerUrl,
    total_servers: servers.length,
    totalServers: servers.length,
    primary_stream: servers[0].embed_url,
    primaryStream: servers[0].embed_url,
    servers
  };
}

module.exports = {
  getHomeCatalog,
  search,
  getTrending,
  getStreams
};
