import React from 'react';
import { Flame, Play } from 'lucide-react';
import type { Movie } from '../types/movie';

interface TopRankedRowProps {
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
}

export const TopRankedRow: React.FC<TopRankedRowProps> = ({
  movies,
  onSelect,
  onWatchNow,
}) => {
  if (movies.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="w-5 h-5 text-[#7c5cff]" />
        <div>
          <h2 className="font-display text-lg sm:text-xl font-black text-white tracking-tight leading-none">
            Top 10 in Your Region Today
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Most watched titles right now across CineVault
          </p>
        </div>
      </div>

      {/* Ranked Horizontal Scroll / Grid */}
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none pb-2">
        {movies.slice(0, 10).map((movie, idx) => {
          const rank = idx + 1;
          return (
            <div
              key={movie.id || movie._id || idx}
              onClick={() => onSelect(movie)}
              className="group relative flex-shrink-0 w-44 sm:w-52 rounded-2xl overflow-hidden bg-[#101018] border border-white/[0.08] hover:border-[#7c5cff]/50 transition-all duration-300 hover:scale-[1.02] shadow-xl cursor-pointer"
            >
              {/* Giant Rank Number Watermark */}
              <div className="absolute -bottom-4 -left-2 text-7xl font-black text-white/[0.07] font-display select-none pointer-events-none z-10 leading-none">
                {rank}
              </div>

              {/* Poster Container */}
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Rank Badge */}
                <div className="absolute top-2 left-2 w-7 h-7 rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#4023c7] text-white font-black text-xs flex items-center justify-center shadow-lg">
                  #{rank}
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-300 shadow">
                  ⭐ {movie.rating.toFixed(1)}
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onWatchNow(movie);
                    }}
                    className="w-10 h-10 rounded-full bg-[#7c5cff] text-white flex items-center justify-center shadow-xl shadow-purple-600/40 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Title & Info */}
              <div className="p-3 bg-[#0c0d14] space-y-1 relative z-20">
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {movie.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                  <span>{movie.releaseYear} • {movie.language?.split(' ')[0]}</span>
                  <span className="text-[#a28bff] font-bold">HD 1080p</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
