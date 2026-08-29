import React from 'react';
import type { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  title?: string;
  subtitle?: string;
  movies: Movie[];
  onSelect: (movie: Movie) => void;
  onWatchNow: (movie: Movie) => void;
}

export const MovieGrid: React.FC<MovieGridProps> = ({
  title,
  subtitle,
  movies,
  onSelect,
  onWatchNow,
}) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="space-y-4 py-3">
      {title && (
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <span className="text-xs text-zinc-500 font-medium">{movies.length} titles</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {movies.map((movie) => (
          <MovieCard
            key={movie._id || movie.id || movie.slug}
            movie={movie}
            onSelect={onSelect}
            onWatchNow={onWatchNow}
          />
        ))}
      </div>
    </div>
  );
};
