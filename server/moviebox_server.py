#!/usr/bin/env python3
"""
MovieBox API & Web Server
Serves the REST API and the Movie Streaming Web Interface.
Runs with standard Python 3 library - zero dependencies required.
"""

import sys
import os
import json
import urllib.parse
import urllib.request
import ssl
import socket
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import moviebox_scraper

PORT = 8080
PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")


class MovieBoxHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            query = urllib.parse.parse_qs(parsed.query)

            # 1. API: Home Catalog (All categorized shelves)
            if path == "/api/home":
                data = moviebox_scraper.get_home_catalog()
                self._send_json({"status": "success", "data": data})
                return

            # 2. API: Trending / Catalog
            elif path == "/api/trending":
                m_type = query.get("type", ["all"])[0]
                genre = query.get("genre", [""])[0]
                page = int(query.get("page", ["1"])[0])
                if genre and genre != "all" and genre != "trending":
                    results = moviebox_scraper.get_by_genre(genre, media_type=m_type if m_type != "all" else "movie")
                else:
                    results = moviebox_scraper.get_trending(media_type=m_type, page=page)
                self._send_json({"status": "success", "count": len(results), "results": results})
                return

            # 3. API: Search
            elif path == "/api/search":
                q = query.get("q", [""])[0]
                page = int(query.get("page", ["1"])[0])
                if not q.strip():
                    self._send_json({"status": "success", "count": 0, "results": []})
                    return
                results = moviebox_scraper.search(q, page=page)
                self._send_json({"status": "success", "query": q, "count": len(results), "results": results})
                return

            # 3.1 API: Real-time Live Autocomplete Suggestions from MovieBox
            elif path == "/api/suggestions":
                q = query.get("q", [""])[0].strip()
                if not q:
                    self._send_json({"status": "success", "suggestions": []})
                    return
                suggestions = moviebox_scraper.search_suggestions(q)
                self._send_json({"status": "success", "query": q, "suggestions": suggestions})
                return

            # 4. API: Details
            elif path == "/api/details":
                item_id = query.get("id", [""])[0].strip()
                d_path = query.get("path", [""])[0].strip()
                m_type = query.get("type", ["movie"])[0]
                if not item_id and not d_path:
                    self._send_json({"status": "error", "message": "Missing 'id' or 'path' parameter"}, status=400)
                    return
                details = moviebox_scraper.get_details(item_id, detail_path=d_path if d_path else None, media_type=m_type)
                self._send_json({"status": "success", "data": details})
                return

            # 5. API: Streams (100% MovieBox Direct CDN MP4 Streams)
            elif path == "/api/streams":
                item_id = query.get("id", [""])[0].strip()
                d_path = query.get("path", [""])[0].strip()
                m_type = query.get("type", ["movie"])[0]
                season = int(query.get("season", ["1"])[0])
                episode = int(query.get("episode", ["1"])[0])
                title = query.get("title", [""])[0].strip()
                if not item_id:
                    self._send_json({"status": "error", "message": "Missing 'id' parameter"}, status=400)
                    return
                streams = moviebox_scraper.get_streams(
                    item_id,
                    media_type=m_type,
                    season=season,
                    episode=episode,
                    title_hint=title if title else None,
                    detail_path_hint=d_path if d_path else None
                )
                self._send_json({"status": "success", "data": streams})
                return

            # 6. API: Video Stream Proxy for Direct MovieBox MP4 (Supports HTTP 206 Partial Content & Range Requests)
            elif path == "/api/proxy_video":
                video_url = query.get("url", [""])[0].strip()
                if not video_url:
                    self.send_error(400, "Missing 'url' parameter")
                    return

                client_range = self.headers.get("Range")
                req_headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "Referer": "https://mzfi.me/",
                    "Origin": "https://mzfi.me"
                }
                if client_range:
                    req_headers["Range"] = client_range

                try:
                    proxy_req = urllib.request.Request(video_url, headers=req_headers)
                    with urllib.request.urlopen(proxy_req, context=moviebox_scraper.SSL_CTX, timeout=60) as upstream_res:
                        status_code = upstream_res.status
                        self.send_response(status_code)
                        self.send_header("Content-Type", upstream_res.headers.get("Content-Type", "video/mp4"))
                        if "Content-Length" in upstream_res.headers:
                            self.send_header("Content-Length", upstream_res.headers.get("Content-Length"))
                        if "Content-Range" in upstream_res.headers:
                            self.send_header("Content-Range", upstream_res.headers.get("Content-Range"))
                        self.send_header("Accept-Ranges", "bytes")
                        self.send_header("Access-Control-Allow-Origin", "*")
                        self.send_header("Access-Control-Allow-Headers", "Range, Content-Type, Accept")
                        self.send_header("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges")
                        self.end_headers()

                        # Stream in 256KB chunks for smooth buffering and high throughput
                        chunk_size = 262144
                        while True:
                            chunk = upstream_res.read(chunk_size)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                    return
                except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError, OSError, socket.error):
                    # Client seeked, paused, or closed connection - clean exit
                    return
                except Exception as e:
                    try:
                        self.send_error(502, f"Proxy Error: {e}")
                    except Exception:
                        pass
                    return

            # Default: Serve static frontend files from public/
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError, OSError, socket.error):
            pass
        except Exception as e:
            import traceback
            traceback.print_exc()
            try:
                self._send_json({"status": "error", "message": str(e)}, status=500)
            except Exception:
                pass


def run(port=PORT):
    # Ensure stdout handles UTF-8 cleanly on Windows
    if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    ThreadingHTTPServer.allow_reuse_address = (os.name != 'nt')
    server_address = ("", port)
    httpd = ThreadingHTTPServer(server_address, MovieBoxHandler)
    print("=====================================================", flush=True)
    print(f"  [MovieBox] Streaming Web App & API Server Running", flush=True)
    print(f"  Web Interface: http://localhost:{port}", flush=True)
    print(f"  API Base URL:  http://localhost:{port}/api/trending", flush=True)
    print("=====================================================", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...", flush=True)
        httpd.server_close()


if __name__ == "__main__":
    port = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    run(port)
