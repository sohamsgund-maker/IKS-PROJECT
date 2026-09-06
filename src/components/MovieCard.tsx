import React from 'react';
import { Star, Play, Info } from 'lucide-react';
import type { Movie } from '../types/movie';
import { CinematicImage } from './CinematicImage';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect, onWatchNow }) => {
  const highestQuality = movie.qualities?.[0]?.quality || '4K UHD';

  return (
    <div
      onClick={() => onSelect(movie)}
      className="group relative bg-[#18181c] rounded-md overflow-hidden border border-white/[0.06] hover:border-white/20 netflix-card-hover shadow-lg flex flex-col justify-between cursor-pointer select-none"
    >
      {/* Poster */}
      <div className="aspect-[2/3] w-full overflow-hidden bg-zinc-900 relative">
        <CinematicImage
          src={movie.posterUrl || movie.backdropUrl}
          fallbackSrc={movie.backdropUrl}
          alt={movie.title}
          aspectRatioClass="aspect-[2/3]"
          titleFallback={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 img-smooth"
        />

        {/* Top Badges */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-1.5 py-0.2 rounded bg-black/85 text-[8px] sm:text-[9px] font-black text-white border border-white/20">
            {highestQuality}
          </span>
          {movie.rating && (
            <span className="px-1.5 py-0.2 rounded bg-black/85 text-[8px] sm:text-[9px] font-black text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>{movie.rating.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Hover Overlay Play / Info Icon */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchNow(movie);
            }}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Watch Now"
            aria-label={`Play ${movie.title}`}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(movie);
            }}
            className="w-10 h-10 rounded-full bg-black/60 border border-white/70 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="More Info"
            aria-label={`Details for ${movie.title}`}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-2.5 bg-[#16161a] space-y-1">
        <h3 className="font-bold text-xs sm:text-sm text-zinc-100 truncate group-hover:text-white transition-colors leading-tight font-display">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
          <span className="text-[#46d369] font-bold">
            {movie.rating ? `${(movie.rating * 10).toFixed(0)}% Match` : '98% Match'}
          </span>
          <span>{movie.releaseYear || '2024'}</span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
