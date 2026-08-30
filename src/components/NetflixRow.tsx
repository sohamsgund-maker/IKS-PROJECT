import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, Star } from 'lucide-react';
import type { Movie } from '../types/movie';

interface NetflixRowProps {
  title: string;
  movies: Movie[];
  isTop10?: boolean;
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  watchlistIds?: Set<string | number>;
}

export const NetflixRow: React.FC<NetflixRowProps> = ({
  title,
  movies,
  isTop10 = false,
  onSelectMovie,
  onPlayMovie,
  onToggleWatchlist,
  watchlistIds = new Set(),
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!movies || movies.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      const newScrollLeft = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
      rowRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  const onScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 20);
    }
  };

  return (
    <section className="space-y-2 group/row relative px-3 sm:px-8 lg:px-12 my-4 sm:my-8 select-none netflix-row-container">
      {/* Row Header Title */}
      <h2 className="text-base sm:text-xl lg:text-2xl font-bold text-[#e5e5e5] hover:text-white transition-colors tracking-tight flex items-center justify-between font-display cursor-pointer px-1">
        <span className="truncate">{title}</span>
        <span className="text-xs text-[#54b9c5] font-normal opacity-80 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity flex-shrink-0 ml-2">
          Explore All ›
        </span>
      </h2>

      {/* Slider Container */}
      <div className="relative">
        {/* Left Arrow Button (Desktop Only) */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-40 w-10 sm:w-12 bg-black/70 hover:bg-black/90 text-white items-center justify-center transition-all cursor-pointer rounded-r"
            title="Scroll Left"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Horizontal Card Track */}
        <div
          ref={rowRef}
          onScroll={onScroll}
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none py-2 sm:py-4 px-1 overscroll-x-contain touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {movies.map((movie, idx) => {
            const isWatchlisted = Boolean(
              (movie.id && watchlistIds.has(movie.id)) ||
              (movie.tmdbId && watchlistIds.has(movie.tmdbId))
            );
            const rank = idx + 1;

            if (isTop10) {
              /* Top 10 Numbered Rank Card */
              return (
                <div
                  key={movie.id || movie.tmdbId || idx}
                  className="flex-shrink-0 flex items-end group/card cursor-pointer relative"
                  onClick={() => onSelectMovie(movie)}
                >
                  {/* Giant Number Watermark */}
                  <span className="netflix-rank-number text-6xl sm:text-8xl lg:text-9xl leading-none select-none transform translate-x-2 sm:translate-x-3 z-10 pointer-events-none font-black">
                    {rank}
                  </span>

                  {/* Card Poster Banner */}
                  <div className="w-28 sm:w-36 md:w-44 aspect-[2/3] rounded overflow-hidden bg-[#202020] relative shadow-lg netflix-card-hover z-20">
                    <img
                      src={movie.posterUrl || movie.backdropUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover img-smooth"
                      loading="lazy"
                      decoding="async"
                    />

                    {/* Top Quality Badge */}
                    <div className="absolute top-1.5 right-1.5 z-20">
                      <span className="px-1 py-0.2 rounded bg-black/80 backdrop-blur-sm text-[8px] sm:text-[9px] font-black text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {movie.rating ? movie.rating.toFixed(1) : '8.5'}
                      </span>
                    </div>

                    {/* Hover Overlay Actions (Laptop/Desktop) */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity p-2 flex flex-col justify-between hidden sm:flex">
                      <div className="flex justify-end">
                        <span className="px-1 py-0.5 rounded bg-[#E50914] text-[9px] font-extrabold text-white">
                          4K UHD
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayMovie(movie);
                          }}
                          className="p-2 rounded-full bg-white text-black hover:bg-white/80 cursor-pointer transition-transform hover:scale-110"
                          title="Play"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                        {onToggleWatchlist && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(movie);
                            }}
                            className="p-2 rounded-full border border-white/60 hover:border-white text-white bg-black/40 cursor-pointer"
                            title="Watchlist"
                          >
                            {isWatchlisted ? <Check className="w-4 h-4 text-[#E50914]" /> : <Plus className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            /* Standard Netflix Landscape Backdrop Banner Card */
            return (
              <div
                key={movie.id || movie.tmdbId || idx}
                onClick={() => onSelectMovie(movie)}
                className="group/item flex-shrink-0 w-36 sm:w-52 md:w-64 rounded-md overflow-hidden bg-[#1f1f1f] relative cursor-pointer netflix-card-hover shadow-md"
              >
                {/* Image (Backdrop preferred or Poster) */}
                <div className="aspect-video w-full overflow-hidden bg-zinc-900 relative">
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500 img-smooth"
                    loading="lazy"
                    decoding="async"
                  />
                  
                  {/* Top Badges (Quality & Language) */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between z-10 pointer-events-none">
                    <span className="px-1.5 py-0.2 rounded bg-black/75 backdrop-blur-sm text-[8px] sm:text-[9px] font-black text-white border border-white/20">
                      4K UHD
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-[#E50914]/90 text-[8px] sm:text-[9px] font-bold text-white shadow">
                      {movie.language?.includes('Hindi') ? 'HINDI' : (movie.language?.includes('Telugu') ? 'TELUGU' : 'DUAL')}
                    </span>
                  </div>

                  {/* Subtle shadow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Title overlay inside card */}
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-md font-display">
                      {movie.title}
                    </h3>
                  </div>
                </div>

                {/* Card Bottom Strip */}
                <div className="p-2 sm:p-2.5 bg-[#181818] space-y-1 sm:space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayMovie(movie);
                        }}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/80 transition-transform hover:scale-110 cursor-pointer shadow"
                        title="Play"
                      >
                        <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
                      </button>

                      {onToggleWatchlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(movie);
                          }}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-zinc-600 hover:border-white text-white flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                          title="Add to My List"
                        >
                          {isWatchlisted ? <Check className="w-3 h-3 text-[#E50914]" /> : <Plus className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMovie(movie);
                      }}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-zinc-600 hover:border-white text-white flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                      title="More Info"
                    >
                      <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-xs font-semibold">
                    <span className="text-[#46d369] font-bold">98% Match</span>
                    <span className="px-1 py-0.2 rounded border border-zinc-700 text-[8px] sm:text-[9px] text-zinc-400">
                      U/A 16+
                    </span>
                    <span className="text-zinc-400">{movie.duration}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-400 truncate">
                    {movie.genres?.slice(0, 2).map((g, i) => (
                      <span key={g}>
                        {g}{i < Math.min(1, (movie.genres?.length || 1) - 1) ? ' • ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button (Desktop Only) */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-40 w-10 sm:w-12 bg-black/70 hover:bg-black/90 text-white items-center justify-center transition-all cursor-pointer rounded-l"
            title="Scroll Right"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </section>
  );
};
