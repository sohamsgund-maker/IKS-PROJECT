import React from 'react';
import { Flame, Play } from 'lucide-react';
import type { Movie } from '../types/movie';

interface TonightsMoodProps {
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
}

export const TonightsMood: React.FC<TonightsMoodProps> = ({
  movies,
  onSelect,
  onWatchNow,
}) => {
  if (movies.length === 0) return null;

  return (
    <section className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-[#7c5cff]" />
        <div>
          <h2 className="font-display text-lg sm:text-xl font-black text-white tracking-tight leading-none">
            Tonight's mood
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Step into each film's world
          </p>
        </div>
      </div>

      {/* Wide Landscape Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {movies.slice(0, 4).map((movie, idx) => (
          <div
            key={movie.id || movie._id || idx}
            onClick={() => onSelect(movie)}
            className="group relative rounded-2xl overflow-hidden bg-[#101018] border border-white/[0.08] hover:border-[#7c5cff]/50 transition-all duration-300 hover:scale-[1.02] shadow-xl cursor-pointer"
          >
            {/* Backdrop Image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <img
                src={movie.backdropUrl || movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-[#08080d]/40 to-transparent" />

              {/* Rating Badge */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-300 flex items-center gap-1 shadow">
                ⭐ {movie.rating.toFixed(1)}
              </div>

              {/* Play Button Overlay on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWatchNow(movie);
                  }}
                  className="w-11 h-11 rounded-full bg-[#7c5cff] text-white flex items-center justify-center shadow-xl shadow-purple-600/40 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>

              {/* Title & Info on Bottom of Card */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-tight drop-shadow">
                  {movie.title}
                </h4>
                <p className="text-[10px] text-zinc-300 font-medium truncate">
                  {movie.releaseYear} • {movie.genres?.slice(0, 2).join(' • ')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
