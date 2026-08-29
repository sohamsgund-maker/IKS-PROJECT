import React from 'react';
import { Star, Play } from 'lucide-react';
import type { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, onWatchNow }) => {
  const highestQuality = movie.qualities?.[0]?.quality || '1080p';

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative bg-[#10111a] rounded-2xl overflow-hidden border border-white/[0.08] hover:border-[#7c5cff]/60 hover:-translate-y-1.5 transition-all duration-300 shadow-xl flex flex-col justify-between cursor-pointer select-none"
    >
      {/* Poster */}
      <div className="aspect-[2/3] w-full overflow-hidden bg-[#07080d] relative">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/[0.12] text-white font-mono text-[10px] font-bold">
            {highestQuality}
          </span>
          {movie.type === 'series' && (
            <span className="px-2 py-0.5 rounded-md bg-[#7c5cff] text-white text-[10px] font-bold">
              SERIES
            </span>
          )}
        </div>

        {/* Hover Overlay Play Icon */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchNow(movie);
            }}
            className="w-12 h-12 rounded-full bg-[#7c5cff] text-white flex items-center justify-center shadow-xl shadow-purple-500/40 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Watch Now"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-3 bg-[#10111a] space-y-1">
        {/* Movie Title */}
        <h3 className="font-bold text-xs sm:text-sm text-zinc-100 truncate group-hover:text-[#7c5cff] transition-colors leading-tight">
          {movie.title}
        </h3>

        {/* Year • Language */}
        <p className="text-[11px] text-zinc-400 font-medium truncate">
          {movie.releaseYear} • {movie.language}
        </p>

        {/* Quality • Rating */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/[0.06] mt-1 text-zinc-300">
          <span className="text-[11px] font-mono text-zinc-400 font-semibold">
            {highestQuality}
          </span>
          <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{movie.rating.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
