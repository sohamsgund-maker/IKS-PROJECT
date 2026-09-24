import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { ApiError } from './utils/apiError.js';

const app = express();

// Security & Parsing Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Structured Request Logging
app.use(requestLogger);

// Video Streaming Proxy for MovieBox Direct CDN Streams
// Supports HTTP 206 Partial Content, Range headers, HEAD/OPTIONS pre-flights, and cross-origin video playback
app.all(['/api/proxy_video', '/proxy_video', '/api/v1/movies/proxy_video'], async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.status(400).json({ error: "Missing 'url' parameter" });
  }

  const upstreamHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Referer: 'https://mzfi.me/',
    Origin: 'https://mzfi.me',
    'Accept-Encoding': 'identity',
  };

  const clientRange = req.headers.range;
  if (clientRange) {
    upstreamHeaders.Range = clientRange;
  }

  // Connect-only timeout controller: only times out if upstream doesn't respond with initial headers
  const connectController = new AbortController();
  let headersReceived = false;
  const connectTimeout = setTimeout(() => {
    if (!headersReceived) {
      connectController.abort();
    }
  }, 15000);

  req.on('close', () => {
    clearTimeout(connectTimeout);
    if (!headersReceived) {
      connectController.abort();
    }
  });

  try {
    let currentTargetUrl = videoUrl;
    let upstreamRes = await fetch(currentTargetUrl, {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: upstreamHeaders,
      signal: connectController.signal,
      redirect: 'manual',
    });

    let redirectHops = 0;
    while ([301, 302, 303, 307, 308].includes(upstreamRes.status) && redirectHops < 5) {
      const nextLoc = upstreamRes.headers.get('location');
      if (!nextLoc) break;
      currentTargetUrl = new URL(nextLoc, currentTargetUrl).toString();
      upstreamRes = await fetch(currentTargetUrl, {
        method: req.method === 'HEAD' ? 'HEAD' : 'GET',
        headers: upstreamHeaders,
        signal: connectController.signal,
        redirect: 'manual',
      });
      redirectHops++;
    }

    headersReceived = true;
    clearTimeout(connectTimeout);

    const status = upstreamRes.status;
    res.status(status);

    const contentType = upstreamRes.headers.get('content-type') || 'video/mp4';
    const contentLength = upstreamRes.headers.get('content-length');
    const contentRange = upstreamRes.headers.get('content-range');

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    if (req.method === 'HEAD' || !upstreamRes.body) {
      return res.end();
    }

    const { Readable } = await import('stream');
    const nodeStream = Readable.fromWeb(upstreamRes.body);

    // Safely handle client disconnects and stream errors without crashing the node process
    nodeStream.on('error', () => {
      if (!res.writableEnded) {
        res.end();
      }
    });

    res.on('error', () => {
      nodeStream.destroy();
    });

    req.on('close', () => {
      nodeStream.destroy();
    });

    nodeStream.pipe(res);
  } catch (err) {
    clearTimeout(connectTimeout);
    if (!res.headersSent) {
      res.status(502).json({ error: `Proxy Error: ${err.message}` });
    }
  }
});

// Global Rate Limiting
app.use('/api', apiRateLimiter);

// API Routing (both /api/v1 and /api aliases supported)
app.use('/api/v1', routes);
app.use('/api', routes);

// 404 Route Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
