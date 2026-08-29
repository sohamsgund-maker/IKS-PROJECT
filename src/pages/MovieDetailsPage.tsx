import React from 'react';
import { 
  Play, Download, Star, ArrowLeft, 
  Film, Check, Plus 
} from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';

interface MovieDetailsPageProps {
  movie: Movie;
  allMovies?: Movie[];
  onBack: () => void;
  onWatchQuality: (movie: Movie, quality: MovieQuality) => void;
  onWatchTrailer?: (movie: Movie) => void;
  onSelectMovie?: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  isWatchlisted?: boolean;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({
  movie,
  allMovies = [],
  onBack,
  onWatchQuality,
  onWatchTrailer,
  onSelectMovie,
  onToggleWatchlist,
  isWatchlisted = false,
}) => {
  const defaultQuality = movie.qualities?.[0] || { quality: '1080p', videoUrl: movie.videoUrl };

  const similarMovies = allMovies
    .filter(m => m.id !== movie.id && (m.genres?.some(g => movie.genres?.includes(g)) || m.language === movie.language))
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in text-zinc-100 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      {/* Main Info Card */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0e0e16] border border-white/[0.08] p-6 sm:p-8 lg:p-10 shadow-2xl">
        {/* Ambient Backdrop Glow */}
        {movie.backdropUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl pointer-events-none transform scale-110"
            style={{ backgroundImage: `url(${movie.backdropUrl})` }}
          />
        )}

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Large Poster */}
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/[0.1] aspect-[2/3] bg-black">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-amber-300 flex items-center gap-1 shadow">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{movie.rating.toFixed(1)} / 10</span>
              </div>
            </div>
          </div>

          {/* Details & Information */}
          <div className="flex-1 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-[#7c5cff]/20 text-[#a28bff] border border-[#7c5cff]/30 text-xs font-bold uppercase tracking-wider">
                  {movie.type === 'series' ? 'TV Series' : 'Movie'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.06] text-zinc-300 text-xs font-medium border border-white/[0.08]">
                  {movie.language}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.06] text-zinc-300 text-xs font-medium border border-white/[0.08]">
                  {movie.releaseYear}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/[0.06] text-zinc-300 text-xs font-medium border border-white/[0.08]">
                  {movie.duration}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>
            </div>

            {/* Genre Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {movie.genres?.map((g) => (
                <span
                  key={g}
                  className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-zinc-300"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <div className="space-y-1">
              <h3 className="text-xs uppercase tracking-wider font-bold text-zinc-400">Storyline</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Director & Cast Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs">
              <div>
                <span className="text-zinc-500 font-medium block">Director:</span>
                <span className="text-zinc-200 font-semibold">{movie.director || 'Popular Filmmaker'}</span>
              </div>
              <div>
                <span className="text-zinc-500 font-medium block">Starring Cast:</span>
                <span className="text-zinc-200 font-semibold">{movie.cast?.join(', ') || 'Ensemble Cast'}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => onWatchQuality(movie, defaultQuality)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7c5cff] hover:bg-[#6a46ff] text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-purple-600/30 hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Now</span>
              </button>

              {onToggleWatchlist && (
                <button
                  onClick={() => onToggleWatchlist(movie)}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 hover:text-white border border-white/[0.12] text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  {isWatchlisted ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Watchlist</span>
                    </>
                  )}
                </button>
              )}

              {movie.trailerUrl && onWatchTrailer && (
                <a
                  href={movie.trailerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <Film className="w-4 h-4 text-red-400" />
                  <span>Trailer</span>
                </a>
              )}

              {movie.downloadUrl && (
                <a
                  href={movie.downloadUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Versions Hub */}
      <div className="space-y-3">
        <h3 className="font-display text-base font-extrabold text-white uppercase tracking-wider">
          Available Stream Qualities
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(movie.qualities || []).map((q) => (
            <div
              key={q.quality}
              className="p-4 rounded-2xl bg-[#0e0e16] border border-white/[0.08] flex items-center justify-between shadow"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-white text-sm block">{q.quality} Full HD</span>
                <span className="text-[11px] text-zinc-400 block">{q.fileSize || 'Standard Size'} • Fast Buffer</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onWatchQuality(movie, q)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7c5cff] hover:bg-[#6a46ff] text-white font-bold text-xs shadow cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Watch</span>
                </button>

                {q.downloadUrl && (
                  <a
                    href={q.downloadUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
                    title="Download this quality"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Similar & Recommended Titles Row */}
      {similarMovies.length > 0 && onSelectMovie && (
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <h3 className="font-display text-base font-extrabold text-white">
            More Like This
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {similarMovies.map((similar) => (
              <div
                key={similar.id}
                onClick={() => onSelectMovie(similar)}
                className="group p-2 rounded-2xl bg-[#0e0e16] border border-white/[0.06] hover:border-[#7c5cff]/50 transition-all cursor-pointer shadow"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-black/40 mb-2">
                  <img
                    src={similar.posterUrl}
                    alt={similar.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {similar.title}
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {similar.releaseYear} • ⭐ {similar.rating.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
