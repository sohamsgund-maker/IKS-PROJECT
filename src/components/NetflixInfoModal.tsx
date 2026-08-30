import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Volume2, VolumeX } from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';

interface NetflixInfoModalProps {
  movie: Movie | null;
  allMovies: Movie[];
  onClose: () => void;
  onPlay: (movie: Movie, quality?: MovieQuality) => void;
  onSelectMovie: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  isWatchlisted?: boolean;
}

export const NetflixInfoModal: React.FC<NetflixInfoModalProps> = ({
  movie,
  allMovies,
  onClose,
  onPlay,
  onSelectMovie,
  onToggleWatchlist,
  isWatchlisted = false,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);

  // Close on Escape key & Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!movie) return null;

  const defaultQuality = movie.qualities?.[0] || { quality: '1080p', videoUrl: movie.videoUrl };

  const similarMovies = allMovies
    .filter(m => m.id !== movie.id && (m.genres?.some(g => movie.genres?.includes(g)) || m.language === movie.language))
    .slice(0, 9);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 lg:p-8 animate-fade-in select-none">
      <div className="bg-[#181818] rounded-t-2xl sm:rounded-xl overflow-hidden max-w-4xl w-full min-h-[90vh] sm:min-h-0 my-auto sm:my-8 shadow-2xl relative text-white border border-zinc-800">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-40 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#181818]/90 text-white hover:bg-zinc-700 flex items-center justify-center cursor-pointer transition-colors shadow-lg"
          title="Close (Esc)"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Hero Video / Backdrop Section */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            decoding="async"
            className="w-full h-full object-cover img-smooth"
          />
          {/* Netflix Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent hidden sm:block" />

          {/* Hero Content Actions */}
          <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-10 right-4 sm:right-10 flex items-end justify-between gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3 max-w-xl">
              <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-lg font-display line-clamp-2">
                {movie.title}
              </h2>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => onPlay(movie, defaultQuality)}
                  className="flex items-center gap-1.5 sm:gap-2 px-5 sm:px-8 py-2 sm:py-2.5 rounded bg-white hover:bg-white/80 text-black font-extrabold text-xs sm:text-base transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  <span>Play</span>
                </button>

                {onToggleWatchlist && (
                  <button
                    onClick={() => onToggleWatchlist(movie)}
                    className="p-2 sm:p-2.5 rounded-full border border-white/60 hover:border-white text-white bg-[#181818]/60 hover:bg-zinc-800 transition-colors cursor-pointer"
                    title={isWatchlisted ? 'Remove from My List' : 'Add to My List'}
                  >
                    {isWatchlisted ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#E50914]" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                )}

                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 sm:p-2.5 rounded-full border transition-colors cursor-pointer ${
                    isLiked
                      ? 'border-white text-[#46d369] bg-white/20'
                      : 'border-white/60 hover:border-white text-white bg-[#181818]/60 hover:bg-zinc-800'
                  }`}
                  title="I like this"
                >
                  <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Mute toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 sm:p-2.5 rounded-full border border-white/60 hover:border-white text-white bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Details & Information Body */}
        <div className="p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 text-xs sm:text-sm">
            {/* Left: Metadata & Storyline (2 Cols) */}
            <div className="md:col-span-2 space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 font-semibold text-[11px] sm:text-sm">
                <span className="text-[#46d369] font-bold">98% Match</span>
                <span className="text-zinc-300">{movie.releaseYear}</span>
                <span className="px-1.5 py-0.2 rounded border border-zinc-500 text-[10px] text-zinc-300 font-bold uppercase">
                  U/A 16+
                </span>
                <span className="text-zinc-300">{movie.duration}</span>
                <span className="px-1.5 py-0.2 rounded border border-zinc-600 text-[9px] text-zinc-400 font-bold">
                  Ultra HD 4K
                </span>
                <span className="text-zinc-300 font-mono">⭐ {movie.rating.toFixed(1)} / 10</span>
              </div>

              <p className="text-zinc-200 leading-relaxed text-xs sm:text-base font-normal">
                {movie.description}
              </p>
            </div>

            {/* Right: Cast, Genres, Tags */}
            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-zinc-400 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
              <div>
                <span className="text-zinc-500">Cast: </span>
                <span className="text-zinc-200">{movie.cast?.join(', ') || 'Featured Stars'}</span>
              </div>

              <div>
                <span className="text-zinc-500">Genres: </span>
                <span className="text-zinc-200">{movie.genres?.join(', ')}</span>
              </div>

              <div>
                <span className="text-zinc-500">Director: </span>
                <span className="text-zinc-200">{movie.director || 'Popular Director'}</span>
              </div>

              <div>
                <span className="text-zinc-500">Audio & Dubs: </span>
                <span className="text-zinc-200">{movie.language} (Original, Hindi Dual-Audio)</span>
              </div>
            </div>
          </div>

          {/* Episodes Section for TV Shows */}
          {movie.type === 'series' && (
            <div className="space-y-3 sm:space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-xl font-bold text-white">Episodes</h3>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="bg-[#242424] border border-zinc-700 text-white rounded px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value={1}>Season 1</option>
                  <option value={2}>Season 2</option>
                  <option value={3}>Season 3</option>
                </select>
              </div>

              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((ep) => (
                  <div
                    key={ep}
                    onClick={() => onPlay(movie, defaultQuality)}
                    className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer border-b border-zinc-800/60 group"
                  >
                    <span className="text-base sm:text-lg font-bold text-zinc-500 w-5 sm:w-6 text-center">{ep}</span>
                    <div className="relative w-24 sm:w-36 aspect-video rounded overflow-hidden bg-black flex-shrink-0">
                      <img
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={`Episode ${ep}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">Episode {ep}</h4>
                        <span className="text-[11px] text-zinc-400 font-mono">48m</span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-2 mt-0.5 sm:mt-1">
                        A critical turn of events leads to dangerous alliances as the narrative unfolds.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* More Like This (Netflix Recommendations Grid) */}
          {similarMovies.length > 0 && (
            <div className="space-y-3 sm:space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-base sm:text-xl font-bold text-white">More Like This</h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {similarMovies.map((similar) => (
                  <div
                    key={similar.id}
                    onClick={() => onSelectMovie(similar)}
                    className="bg-[#242424] rounded-lg overflow-hidden flex flex-col justify-between hover:scale-105 transition-transform duration-300 cursor-pointer shadow-lg group/sim"
                  >
                    <div className="aspect-video relative overflow-hidden bg-black">
                      <img
                        src={similar.backdropUrl || similar.posterUrl}
                        alt={similar.title}
                        className="w-full h-full object-cover group-hover/sim:scale-105 transition-transform"
                      />
                      <div className="absolute top-1.5 right-1.5 text-[10px] sm:text-xs font-bold text-white drop-shadow bg-black/60 px-1.5 py-0.2 rounded">
                        ⭐ {similar.rating.toFixed(1)}
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-3 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-bold text-[#46d369]">97% Match</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlay(similar);
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white/60 hover:border-white text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
                        </button>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                          {similar.title}
                        </h4>
                        <p className="text-[10px] sm:text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                          {similar.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About This Title Section */}
          <div className="pt-4 border-t border-zinc-800 text-[11px] sm:text-xs text-zinc-400 space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              About {movie.title}
            </h4>
            <p><strong className="text-zinc-300">Director:</strong> {movie.director || 'Popular Filmmaker'}</p>
            <p><strong className="text-zinc-300">Cast:</strong> {movie.cast?.join(', ') || 'Ensemble Cast'}</p>
            <p><strong className="text-zinc-300">Genres:</strong> {movie.genres?.join(', ')}</p>
            <p><strong className="text-zinc-300">Maturity Rating:</strong> Recommended for ages 16 and up for intense action, language, and violence.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
