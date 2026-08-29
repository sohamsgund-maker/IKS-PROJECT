import React from 'react';
import { Clock, Play } from 'lucide-react';
import type { Movie } from '../types/movie';

interface ContinueWatchingProps {
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({
  movies,
  onSelect,
  onWatchNow,
}) => {
  if (movies.length === 0) return null;

  // Mock progression stats for realistic display
  const progressList = [
    { progress: 75, timeLeft: '42m left' },
    { progress: 40, timeLeft: '1h 12m left' },
    { progress: 85, timeLeft: '18m left' },
    { progress: 20, timeLeft: '1h 45m left' },
  ];

  return (
    <section className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#7c5cff]" />
        <div>
          <h2 className="font-display text-lg sm:text-xl font-black text-white tracking-tight leading-none">
            Continue your journey
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pick up where you left off
          </p>
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {movies.slice(0, 6).map((movie, idx) => {
          const itemProgress = progressList[idx % progressList.length];
          return (
            <div
              key={movie.id || movie._id || idx}
              onClick={() => onSelect(movie)}
              className="group relative rounded-2xl overflow-hidden bg-[#101018] border border-white/[0.08] hover:border-[#7c5cff]/50 transition-all duration-300 hover:scale-[1.02] shadow-lg cursor-pointer"
            >
              {/* Poster Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-300 flex items-center gap-0.5 shadow">
                  ⭐ {movie.rating.toFixed(1)}
                </div>

                {/* Play Button Overlay on Hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatchNow(movie);
                    }}
                    className="w-10 h-10 rounded-full bg-[#7c5cff] text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Progress & Bottom Bar */}
              <div className="p-2.5 bg-[#0e0e16] space-y-1.5">
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {movie.title}
                </h4>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                  <span className="text-[#a28bff] font-bold">{itemProgress.progress}%</span>
                  <span>• {itemProgress.timeLeft}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/[0.1] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7c5cff] to-[#a28bff] rounded-full"
                    style={{ width: `${itemProgress.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
