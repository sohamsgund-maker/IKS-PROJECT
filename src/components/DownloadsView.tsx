import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Movie, DownloadItem } from '../types/movie';
import { cacheService } from '../services/cacheService';
import {
  Download,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
} from 'lucide-react';

interface DownloadsViewProps {
  onPlayMovie: (movie: Movie, season?: number, episode?: number) => void;
  onExploreMovies: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = memo(({
  onPlayMovie,
  onExploreMovies,
}) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  // Load downloads
  const loadData = useCallback(() => {
    try {
      const dl = cacheService.getDownloads();
      setDownloads(dl);
    } catch {}
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh downloads periodically if any item is actively downloading
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

  // Handle Delete Download
  const handleDeleteDownload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    cacheService.deleteDownload(id);
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  // Handle Clear All Downloads
  const handleClearAll = () => {
    if (!window.confirm('Delete all offline downloaded videos from device?')) return;
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    downloads.forEach((d) => cacheService.deleteDownload(d.id));
    setDownloads([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 animate-fade-in pb-24 md:pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#292E35] pb-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-headline text-[#F5F5F2]">
            Downloads
          </h1>
          <p className="text-xs text-[#9A9FA8] mt-0.5">
            {downloads.length === 0
              ? 'Watch offline without internet'
              : `${downloads.length} ${downloads.length === 1 ? 'item' : 'items'} available offline`}
          </p>
        </div>

        {downloads.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 text-xs font-semibold border border-red-500/30 transition-all cursor-pointer press-feedback"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All</span>
          </button>
        )}
      </div>

      {/* Content */}
      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#15181D]/40 border border-[#292E35] rounded-2xl p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#F0B429]/10 border border-[#F0B429]/20 flex items-center justify-center text-[#F0B429] mb-4 shadow-lg shadow-[#F0B429]/5">
            <Download className="w-8 h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#F5F5F2] font-headline">
            No Downloads Yet
          </h2>
          <p className="text-xs sm:text-sm text-[#9A9FA8] mt-1.5 max-w-sm leading-relaxed">
            Download your favorite movies and episodes to watch offline anywhere with zero buffering.
          </p>
          <button
            type="button"
            onClick={onExploreMovies}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F0B429] hover:bg-[#c49742] text-[#0B0D10] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#F0B429]/20 press-feedback"
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
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9A9FA8] hover:text-rose-400 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors press-feedback cursor-pointer"
                      title="Delete from device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-[#F5F5F2] truncate mt-1.5 group-hover:text-[#F0B429] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  {item.season && item.episode && (
                    <p className="text-[11px] text-[#9A9FA8] font-mono mt-0.5">
                      Season {item.season} • Episode {item.episode}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[#9A9FA8] mt-1.5">
                    {item.status === 'completed' && (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready Offline</span>
                      </span>
                    )}
                    {item.status === 'downloading' && (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Downloading {item.progress}%</span>
                      </span>
                    )}
                    {item.status === 'failed' && (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Download Failed</span>
                      </span>
                    )}
                    {item.sizeFormatted && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{item.sizeFormatted}</span>
                      </>
                    )}
                  </div>
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
  );
});

DownloadsView.displayName = 'DownloadsView';
