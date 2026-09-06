import React from 'react';
import { Clock, Play } from 'lucide-react';
import type { Movie } from '../types/movie';
import { CinematicImage } from './CinematicImage';

export interface WatchProgressItem {
  movie: Movie;
  playbackPosition?: number;
  duration?: number;
  timestamp?: number;
}

interface ContinueWatchingProps {
  items?: WatchProgressItem[];
  movies?: Movie[];
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie, resumeTime?: number) => void;
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({
  items,
  movies,
  onSelect,
  onWatchNow,
}) => {
  // Normalize items whether passed as WatchProgressItem[] or Movie[]
  const watchList: WatchProgressItem[] = items && items.length > 0
    ? items
    : (movies || []).map((m, idx) => ({
        movie: m,
        playbackPosition: 1800 + idx * 300,
        duration: 7200,
        timestamp: Date.now() - idx * 3600000,
      }));

  if (watchList.length === 0) return null;

  const formatResumeTime = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <section className="space-y-3 px-3 sm:px-8 lg:px-12 my-4 select-none">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#E50914]" />
        <div>
          <h2 className="font-display text-sm sm:text-lg lg:text-xl font-bold text-[#e5e5e5] tracking-tight leading-none">
            Continue Watching
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
            Pick up right where you left off
          </p>
        </div>
      </div>

      {/* Cards Row */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto scrollbar-none py-2 px-1">
        {watchList.slice(0, 8).map((item, idx) => {
          const m = item.movie;
          const pos = item.playbackPosition || 0;
          const dur = item.duration || 7200;
          const progressPercent = Math.min(100, Math.max(5, Math.round((pos / dur) * 100)));

          return (
            <div
              key={m.id || m._id || idx}
              onClick={() => onSelect(m)}
              className="flex-shrink-0 w-36 sm:w-52 md:w-60 rounded-md overflow-hidden bg-[#18181c] border border-white/[0.06] hover:border-white/20 netflix-card-hover shadow-lg cursor-pointer group"
            >
              {/* Backdrop / Poster Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <CinematicImage
                  src={m.backdropUrl || m.posterUrl}
                  fallbackSrc={m.posterUrl}
                  alt={m.title}
                  aspectRatioClass="aspect-video"
                  titleFallback={m.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 img-smooth"
                />

                {/* Rating Badge */}
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded bg-black/85 text-[9px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shadow pointer-events-none">
                  ⭐ {m.rating ? m.rating.toFixed(1) : '8.5'}
                </div>

                {/* Play Button Overlay on Hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatchNow(m, pos);
                    }}
                    className="w-10 h-10 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-xl shadow-red-900/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    title={`Resume at ${formatResumeTime(pos)}`}
                    aria-label={`Resume ${m.title}`}
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>

                {/* Inset Progress Bar at bottom of thumbnail */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-[#E50914]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Progress & Info Bar */}
              <div className="p-2 sm:p-2.5 bg-[#16161a] space-y-1">
                <h4 className="text-xs font-bold text-white truncate leading-tight font-display">
                  {m.title}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                  <span className="text-emerald-400 font-bold">Resume at {formatResumeTime(pos)}</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ContinueWatching;
