import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Movie, DownloadItem, CachedMovie } from '../types/movie';
import { cacheService } from '../services/cacheService';
import {
  Download,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Film,
  Clock,
} from 'lucide-react';

interface DownloadsViewProps {
  onPlayMovie: (movie: Movie, season?: number, episode?: number) => void;
  onExploreMovies: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = memo(({
  onPlayMovie,
  onExploreMovies,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'cached'>('downloads');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [cachedMovies, setCachedMovies] = useState<CachedMovie[]>([]);
  const [nativeCacheSize, setNativeCacheSize] = useState<string>('0 MB');
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Load data
  const loadData = useCallback(() => {
    try {
      const dl = cacheService.getDownloads();
      setDownloads(dl);

      const seen = cacheService.getWatchedMovies();
      setCachedMovies(seen);

      // Check native cache size if on Android
      if (typeof window !== 'undefined' && (window as any).AndroidDevice?.getCacheSize) {
        try {
          const bytes = (window as any).AndroidDevice.getCacheSize();
          const mb = (bytes / (1024 * 1024)).toFixed(1);
          setNativeCacheSize(`${mb} MB`);
        } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh downloads periodically if any item is downloading
    const interval = setInterval(() => {
      const current = cacheService.getDownloads();
      const hasActive = current.some((d) => d.status === 'downloading');
      if (hasActive) {
        setDownloads(current);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Play Offline Download
  const handlePlayDownloaded = (item: DownloadItem) => {
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    let playUrl = item.streamUrl;
    if (item.localPath) {
      if (typeof window !== 'undefined' && (window as any).AndroidDevice?.getProxyVideoUrl) {
        try {
          playUrl = (window as any).AndroidDevice.getProxyVideoUrl(item.localPath);
        } catch {
          const port = (window as any).AndroidDevice?.getLocalProxyPort?.() || 8888;
          playUrl = `http://127.0.0.1:${port}/local_media?path=${encodeURIComponent(item.localPath)}`;
        }
      } else {
        const port = typeof window !== 'undefined' && (window as any).AndroidDevice?.getLocalProxyPort?.() ? (window as any).AndroidDevice.getLocalProxyPort() : 8888;
        playUrl = `http://127.0.0.1:${port}/local_media?path=${encodeURIComponent(item.localPath)}`;
      }
    }
    const movieToPlay: Movie = {
      ...item.movie,
      streamUrl: playUrl,
    };
    onPlayMovie(movieToPlay, item.season, item.episode);
  };

  // Handle Play Cached Movie
  const handlePlayCached = (item: CachedMovie) => {
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    const playUrl = item.streamUrl || (item.movie as any)?.streamUrl;
    const movieToPlay: Movie = {
      ...item.movie,
      streamUrl: playUrl,
    };
    onPlayMovie(movieToPlay, item.season, item.episode);
  };

  // Handle Delete Download
  const handleDeleteDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    cacheService.deleteDownload(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  // Handle Delete Single Cached Movie
  const handleDeleteCached = (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    cacheService.removeWatchedMovie(movieId);
    setCachedMovies((prev) => prev.filter((c) => c.movie.id !== movieId));
  };

  // Handle Clear All Cached Seen Movies & Android Stream Cache
  const handleClearCache = async () => {
    if (!window.confirm('Clear all watched playback history and cached video data?')) {
      return;
    }
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    setIsClearing(true);
    try {
      cacheService.clearWatchedMovies();
      setCachedMovies([]);

      if (typeof window !== 'undefined' && (window as any).AndroidDevice?.clearStreamCache) {
        try {
          (window as any).AndroidDevice.clearStreamCache();
          setNativeCacheSize('0 MB');
        } catch {}
      }
    } finally {
      setIsClearing(false);
    }
  };

  // Format seconds to hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format relative date
  const formatRelativeDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / (60 * 1000));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Total downloads size calculation
  const totalDownloadSizeFormatted = React.useMemo(() => {
    const totalBytes = downloads.reduce((acc, curr) => acc + (curr.totalBytes || 0), 0);
    if (totalBytes === 0) return downloads.length > 0 ? `${downloads.length} items` : '0 MB';
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }, [downloads]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Header & Storage Status Widget */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#292E35] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F0B429] bg-[#F0B429]/10 px-2.5 py-0.5 rounded-full border border-[#F0B429]/30 font-mono">
                Offline & Bufferless
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline text-[#F5F5F2]">
              Downloads & Storage
            </h1>
            <p className="text-xs sm:text-sm text-[#9A9FA8] mt-1">
              Manage saved offline videos and cached streaming playback data.
            </p>
          </div>

          {/* Quick Storage Overview Card */}
          <div className="flex items-center gap-3 bg-[#15181D] border border-[#292E35] rounded-2xl p-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#F0B429]/10 flex items-center justify-center text-[#F0B429] shrink-0 border border-[#F0B429]/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#9A9FA8]">Saved Offline:</span>
                <span className="font-bold text-[#F5F5F2] font-mono">{totalDownloadSizeFormatted}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[#9A9FA8]">Seen Cache:</span>
                <span className="font-bold text-[#F0B429] font-mono">
                  {cachedMovies.length} movies ({nativeCacheSize})
                </span>
              </div>
            </div>

            {cachedMovies.length > 0 && (
              <button
                type="button"
                onClick={handleClearCache}
                disabled={isClearing}
                className="ml-2 text-[11px] font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/30 px-3 py-2 rounded-xl transition-colors cursor-pointer press-feedback min-h-[36px]"
                title="Clear cached stream data to free device memory"
              >
                {isClearing ? 'Clearing...' : 'Clear Cache'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2.5 sm:gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
              setActiveTab('downloads');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer press-feedback min-h-[44px] ${
              activeTab === 'downloads'
                ? 'bg-[#F0B429] text-[#0B0D10] shadow-md shadow-[#F0B429]/20 font-bold'
                : 'bg-[#15181D] text-[#9A9FA8] hover:text-[#F5F5F2] border border-[#292E35]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Offline Downloads</span>
            {downloads.length > 0 && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'downloads' ? 'bg-[#0B0D10] text-[#F0B429]' : 'bg-white/10 text-white'
                }`}
              >
                {downloads.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
              setActiveTab('cached');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer press-feedback min-h-[44px] ${
              activeTab === 'cached'
                ? 'bg-[#F0B429] text-[#0B0D10] shadow-md shadow-[#F0B429]/20 font-bold'
                : 'bg-[#15181D] text-[#9A9FA8] hover:text-[#F5F5F2] border border-[#292E35]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Watched & Cached</span>
            {cachedMovies.length > 0 && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'cached' ? 'bg-[#0B0D10] text-[#F0B429]' : 'bg-white/10 text-white'
                }`}
              >
                {cachedMovies.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Offline Downloads */}
      {activeTab === 'downloads' && (
        <div className="animate-fade-in">
          {downloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#15181D]/50 border border-[#292E35] rounded-2xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#F0B429]/10 border border-[#F0B429]/20 flex items-center justify-center text-[#F0B429] mb-4 shadow-lg shadow-[#F0B429]/5">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F5F2] font-headline">No Offline Downloads Yet</h3>
              <p className="text-xs sm:text-sm text-[#9A9FA8] max-w-sm mt-1.5 leading-relaxed">
                Download your favorite movies and series directly to your device storage to watch offline anywhere with zero buffering.
              </p>
              <button
                type="button"
                onClick={onExploreMovies}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F0B429] hover:bg-[#c49742] text-[#0B0D10] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#F0B429]/20 press-feedback min-h-[44px]"
              >
                <Film className="w-4 h-4" />
                <span>Explore Movies</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {downloads.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePlayDownloaded(item)}
                  className="group relative flex gap-3 p-3 bg-[#15181D] hover:bg-[#1D2127] active:bg-[#0B0D10] border border-[#292E35] hover:border-[#F0B429]/50 rounded-2xl transition-all cursor-pointer shadow-[var(--shadow-card)] overflow-hidden press-feedback"
                >
                  {/* Poster Thumbnail */}
                  <div className="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-[#0B0D10] shrink-0 border border-white/10">
                    <img
                      src={item.movie.poster}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-9 h-9 rounded-full bg-[#F0B429] flex items-center justify-center text-black shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Controls */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold font-mono text-[#F0B429] bg-[#F0B429]/10 px-2 py-0.5 rounded-md border border-[#F0B429]/30">
                          {item.quality}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDownload(item.id, e)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9A9FA8] hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors press-feedback"
                          title="Delete from device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="text-sm font-bold text-[#F5F5F2] truncate mt-1.5 group-hover:text-[#F0B429] transition-colors leading-snug">
                        {item.title}
                      </h4>

                      {item.season && item.episode && (
                        <p className="text-[11px] text-[#9A9FA8] font-mono mt-0.5">
                          Season {item.season} • Episode {item.episode}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-[#9A9FA8] mt-1">
                        {item.status === 'completed' && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready Offline</span>
                          </span>
                        )}
                        {item.status === 'downloading' && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Downloading {item.progress}%</span>
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="flex items-center gap-1 text-rose-400">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}
                        {item.sizeFormatted && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{item.sizeFormatted}</span>
                          </>
                        )}
                      </div>

                      {item.status === 'completed' && (
                        <div className="text-[10px] text-[#F0B429]/90 font-mono mt-1.5 flex items-center gap-1.5 bg-[#0B0D10]/70 px-2 py-1 rounded-md border border-[#292E35]">
                          <span className="shrink-0">📁</span>
                          <span className="truncate">Download/CineVault</span>
                          <span className="text-[9px] text-emerald-400 font-bold ml-auto shrink-0 uppercase tracking-wider">Device Storage</span>
                        </div>
                      )}
                    </div>

                    {/* Download Progress Bar */}
                    {item.status === 'downloading' && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-2">
                        <div
                          className="bg-[#F0B429] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Watched & Cached Movies */}
      {activeTab === 'cached' && (
        <div className="animate-fade-in">
          {cachedMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#15181D]/50 border border-[#292E35] rounded-2xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#F0B429]/10 border border-[#F0B429]/20 flex items-center justify-center text-[#F0B429] mb-4 shadow-lg shadow-[#F0B429]/5">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#F5F5F2] font-headline">No Watched Movies In Cache</h3>
              <p className="text-xs sm:text-sm text-[#9A9FA8] max-w-sm mt-1.5 leading-relaxed">
                Whenever you stream a movie or episode, CineVault automatically caches your playback progress and media data here for instant 0ms resume.
              </p>
              <button
                type="button"
                onClick={onExploreMovies}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F0B429] hover:bg-[#c49742] text-[#0B0D10] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#F0B429]/20 press-feedback min-h-[44px]"
              >
                <Film className="w-4 h-4" />
                <span>Start Watching</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {cachedMovies.map((item) => {
                const pos = item.savedPosition ?? item.progressSeconds ?? 0;
                const dur = item.duration ?? item.durationSeconds ?? 0;
                const percent = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : (item.progressPercent ?? 0);
                const watchedTime = item.timestamp ?? item.lastWatchedAt ?? Date.now();
                const sNum = item.season ?? item.lastSeason;
                const epNum = item.episode ?? item.lastEpisode;

                return (
                  <div
                    key={item.movie.id}
                    onClick={() => handlePlayCached(item)}
                    className="group relative flex gap-3 p-3 bg-[#15181D] hover:bg-[#1D2127] active:bg-[#0B0D10] border border-[#292E35] hover:border-[#F0B429]/50 rounded-2xl transition-all cursor-pointer shadow-[var(--shadow-card)] overflow-hidden press-feedback"
                  >
                    {/* Poster Thumbnail */}
                    <div className="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden bg-[#0B0D10] shrink-0 border border-white/10">
                      <img
                        src={item.movie.poster}
                        alt={item.movie.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-9 h-9 rounded-full bg-[#F0B429] flex items-center justify-center text-black shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Content & Progress */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-semibold text-[#9A9FA8]">
                            {formatRelativeDate(watchedTime)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCached(item.movie.id, e)}
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9A9FA8] hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors press-feedback"
                            title="Remove from history"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <h4 className="text-sm font-bold text-[#F5F5F2] truncate mt-1 group-hover:text-[#F0B429] transition-colors leading-snug">
                          {item.movie.title}
                        </h4>

                        {sNum && epNum && (
                          <p className="text-[11px] text-[#F0B429] font-mono mt-0.5">
                            Season {sNum} • Episode {epNum}
                          </p>
                        )}

                        <div className="text-[11px] text-[#9A9FA8] font-mono mt-2">
                          <span>{formatTime(pos)}</span>
                          <span className="text-[#4F5662]"> / </span>
                          <span>{formatTime(dur)}</span>
                          <span className="text-[#F0B429] font-semibold ml-1.5">({percent}%)</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden mt-2">
                        <div
                          className="bg-[#F0B429] h-full rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DownloadsView.displayName = 'DownloadsView';
