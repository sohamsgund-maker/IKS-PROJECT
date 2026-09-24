import type { Movie, CachedMovie, DownloadItem } from '../types/movie';

const SEEN_CACHE_KEY = 'cinevault_seen_cache';
const DOWNLOADS_KEY = 'cinevault_downloads_archive';

class CacheService {
  /**
   * Automatically save or update watched movie progress in persistent app cache
   */
  public saveWatchedProgress(
    movie: Movie,
    progressSeconds: number,
    durationSeconds: number,
    season?: number,
    episode?: number,
    streamUrl?: string
  ): void {
    if (!movie || !movie.id) return;
    try {
      const items = this.getWatchedMovies();
      const existingIdx = items.findIndex((item) => item.movie.id === movie.id);
      const validDuration = durationSeconds > 0 ? durationSeconds : 1;
      const progressPercent = Math.min(100, Math.max(0, Math.round((progressSeconds / validDuration) * 100)));

      const now = Date.now();
      const cachedEntry: CachedMovie = {
        movie,
        lastWatchedAt: now,
        timestamp: now,
        lastSeason: season,
        season,
        lastEpisode: episode,
        episode,
        progressSeconds: Math.floor(progressSeconds),
        savedPosition: Math.floor(progressSeconds),
        durationSeconds: Math.floor(durationSeconds),
        duration: Math.floor(durationSeconds),
        progressPercent,
        streamUrl: streamUrl || (existingIdx >= 0 ? items[existingIdx].streamUrl : undefined),
      };

      if (existingIdx >= 0) {
        items[existingIdx] = cachedEntry;
      } else {
        items.unshift(cachedEntry);
      }

      // Limit to 60 most recently watched titles to prevent storage bloat
      const trimmed = items.slice(0, 60);

      // Defer localStorage write to idle time to avoid blocking the main thread during playback
      const doWrite = () => {
        try {
          localStorage.setItem(SEEN_CACHE_KEY, JSON.stringify(trimmed));
        } catch {}
      };

      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(doWrite, { timeout: 2000 });
      } else {
        setTimeout(doWrite, 0);
      }
    } catch (err) {
      console.warn('Failed to save watched movie cache:', err);
    }
  }

  /**
   * Retrieve all watched movies saved in app data cache
   */
  public getWatchedMovies(): CachedMovie[] {
    try {
      const raw = localStorage.getItem(SEEN_CACHE_KEY);
      if (!raw) return [];
      const parsed: CachedMovie[] = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt)
        : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove a single movie from watched cache
   */
  public removeWatchedMovie(movieId: string): void {
    try {
      const items = this.getWatchedMovies().filter((item) => item.movie.id !== movieId);
      localStorage.setItem(SEEN_CACHE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to remove watched movie:', err);
    }
  }

  /**
   * Clear all watched movies from cache
   */
  public clearWatchedMovies(): void {
    try {
      localStorage.removeItem(SEEN_CACHE_KEY);
    } catch (err) {
      console.warn('Failed to clear watched movies:', err);
    }
  }

  /**
   * Retrieve all download items (merging native Android tasks when available)
   */
  public getDownloads(): DownloadItem[] {
    try {
      const raw = localStorage.getItem(DOWNLOADS_KEY);
      let items: DownloadItem[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(items)) items = [];

      // If running inside Android Native shell, query native download manager
      if (typeof window !== 'undefined' && (window as any).AndroidDevice?.getDownloadTasks) {
        try {
          const nativeRaw = (window as any).AndroidDevice.getDownloadTasks();
          if (nativeRaw) {
            const nativeTasks: any[] = JSON.parse(nativeRaw);
            items = items.map((item) => {
              const matched = nativeTasks.find((nt) => nt.id === item.id || nt.nativeId === item.nativeDownloadId);
              if (matched) {
                return {
                  ...item,
                  status: matched.status || item.status,
                  progress: typeof matched.progress === 'number' ? matched.progress : item.progress,
                  downloadedBytes: matched.downloadedBytes ?? item.downloadedBytes,
                  totalBytes: matched.totalBytes ?? item.totalBytes,
                  localPath: matched.localPath || item.localPath,
                };
              }
              return item;
            });
            // Update storage with synchronized values
            localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(items));
          }
        } catch (e) {
          console.warn('Error reading native download tasks:', e);
        }
      }

      return items.sort((a, b) => b.createdAt - a.createdAt);
    } catch {
      return [];
    }
  }

  /**
   * Start downloading a movie or episode
   */
  public async startDownload(
    movie: Movie,
    streamUrl: string,
    quality: string = '720p',
    season?: number,
    episode?: number
  ): Promise<DownloadItem> {
    const isTv = movie.media_type === 'tv' || movie.media_type === 'series' || (season !== undefined && episode !== undefined);
    const downloadId = `${movie.id}_${season || 1}_${episode || 1}_${quality}_${Date.now()}`;
    const cleanTitle = isTv && season && episode 
      ? `${movie.title} S${season}E${episode}` 
      : movie.title;

    const newItem: DownloadItem = {
      id: downloadId,
      movieId: movie.id,
      title: cleanTitle,
      poster: movie.poster,
      backdrop: movie.backdrop,
      detailPath: movie.detailPath,
      mediaType: movie.media_type,
      season,
      episode,
      quality,
      streamUrl,
      status: 'downloading',
      progress: 0,
      createdAt: Date.now(),
      movie,
    };

    // Save to local downloads archive
    const existing = this.getDownloads().filter(
      (item) => !(item.movieId === movie.id && item.season === season && item.episode === episode)
    );
    existing.unshift(newItem);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(existing));

    // Dispatch native Android download if available
    if (typeof window !== 'undefined' && (window as any).AndroidDevice?.startDownload) {
      try {
        const nativeId = (window as any).AndroidDevice.startDownload(
          streamUrl,
          cleanTitle,
          movie.poster,
          quality,
          movie.id,
          movie.detailPath,
          season || 1,
          episode || 1
        );
        if (nativeId) {
          newItem.nativeDownloadId = Number(nativeId);
          this.updateDownloadItem(newItem);
        }
        return newItem;
      } catch (err) {
        console.warn('Native download failed, continuing with browser fallback:', err);
      }
    }

    // Web / Fallback simulated progressive download & browser anchor trigger
    this.startBrowserDownload(newItem);
    return newItem;
  }

  /**
   * Progressive download tracking for Web & Fallback environments
   */
  private startBrowserDownload(item: DownloadItem): void {
    // Trigger browser direct download
    try {
      const anchor = document.createElement('a');
      anchor.href = item.streamUrl;
      anchor.download = `${item.title.replace(/[^a-zA-Z0-9_\- ]/g, '')}_${item.quality}.mp4`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (e) {
      console.warn('Anchor trigger error:', e);
    }

    // Simulate progress ticker for web UX
    let curProgress = 5;
    const interval = setInterval(() => {
      curProgress += Math.floor(Math.random() * 12) + 5;
      if (curProgress >= 100) {
        curProgress = 100;
        clearInterval(interval);
        this.updateDownloadItem({
          ...item,
          status: 'completed',
          progress: 100,
          totalBytes: 450 * 1024 * 1024,
          downloadedBytes: 450 * 1024 * 1024,
        });
      } else {
        this.updateDownloadItem({
          ...item,
          status: 'downloading',
          progress: curProgress,
          totalBytes: 450 * 1024 * 1024,
          downloadedBytes: Math.floor((450 * 1024 * 1024 * curProgress) / 100),
        });
      }
    }, 1200);
  }

  /**
   * Update a download item in storage
   */
  public updateDownloadItem(item: DownloadItem): void {
    try {
      const downloads = this.getDownloads();
      const idx = downloads.findIndex((d) => d.id === item.id);
      if (idx >= 0) {
        downloads[idx] = item;
      } else {
        downloads.unshift(item);
      }
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
    } catch (err) {
      console.warn('Failed to update download item:', err);
    }
  }

  /**
   * Cancel and delete a download
   */
  public deleteDownload(id: string): void {
    try {
      const downloads = this.getDownloads();
      const target = downloads.find((d) => d.id === id);
      if (target?.nativeDownloadId && (window as any).AndroidDevice?.cancelDownload) {
        try {
          (window as any).AndroidDevice.cancelDownload(target.nativeDownloadId);
        } catch {}
      }
      const filtered = downloads.filter((d) => d.id !== id);
      localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(filtered));
    } catch (err) {
      console.warn('Failed to delete download:', err);
    }
  }

  /**
   * Calculate storage stats (Cached streams, Watched metadata, and Downloads)
   */
  public async getStorageStats(): Promise<{
    watchedCount: number;
    downloadsCount: number;
    estimatedCacheBytes: number;
    formattedCacheSize: string;
    formattedDownloadsSize: string;
  }> {
    const watched = this.getWatchedMovies();
    const downloads = this.getDownloads();

    let nativeCacheBytes = 0;
    if (typeof window !== 'undefined' && (window as any).AndroidDevice?.getCacheSize) {
      try {
        nativeCacheBytes = Number((window as any).AndroidDevice.getCacheSize()) || 0;
      } catch {}
    }

    const totalDownloadBytes = downloads.reduce((acc, d) => acc + (d.downloadedBytes || (d.status === 'completed' ? 420 * 1024 * 1024 : 0)), 0);
    const totalCacheBytes = nativeCacheBytes + (watched.length * 15 * 1024 * 1024); // approx media buffer & poster cache

    return {
      watchedCount: watched.length,
      downloadsCount: downloads.length,
      estimatedCacheBytes: totalCacheBytes,
      formattedCacheSize: this.formatBytes(totalCacheBytes),
      formattedDownloadsSize: this.formatBytes(totalDownloadBytes),
    };
  }

  /**
   * Clear all stream cache and app watch records
   */
  public async clearAllCache(): Promise<void> {
    this.clearWatchedMovies();
    if (typeof window !== 'undefined' && (window as any).AndroidDevice?.clearStreamCache) {
      try {
        (window as any).AndroidDevice.clearStreamCache();
      } catch {}
    }
  }

  private formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  }
}

export const cacheService = new CacheService();
