import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Film, ChevronRight } from 'lucide-react';
import type { Movie } from '../types/movie';

interface HeroSectionProps {
  movie: Movie;
  featuredList?: Movie[];
  onWatchNow: (movie: Movie) => void;
  onDetails: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  isWatchlisted?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  movie: initialMovie,
  featuredList = [],
  onWatchNow,
  onDetails,
  onToggleWatchlist,
  isWatchlisted = false,
}) => {
  const [activeMovie, setActiveMovie] = useState<Movie>(initialMovie);

  useEffect(() => {
    setActiveMovie(initialMovie);
  }, [initialMovie]);

  const spotlightList = featuredList.length > 0 ? featuredList.slice(0, 4) : [initialMovie];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#090a10]">
      {/* Background Backdrop with Cinematic Vignette */}
      <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] w-full flex items-center">
        <img
          src={activeMovie.backdropUrl || activeMovie.posterUrl}
          alt={activeMovie.title}
          className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 transform scale-105"
        />

        {/* Deep cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08080d] via-[#08080d]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080d] via-transparent to-[#08080d]/40" />

        {/* Hero Content Container */}
        <div className="relative z-10 w-full px-6 sm:px-10 lg:px-12 py-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Left Main Information */}
          <div className="max-w-2xl space-y-4">
            {/* Spotlight Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.1] text-zinc-300 text-[11px] font-extrabold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c5cff] animate-ping" />
              <span>• FEATURED SPOTLIGHT</span>
            </div>

            {/* Title */}
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-lg">
              {activeMovie.title}
            </h1>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-semibold">
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.08] text-zinc-200 border border-white/[0.08]">
                {activeMovie.releaseYear}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.08] text-zinc-200 border border-white/[0.08]">
                {activeMovie.type === 'series' ? 'Series' : 'Movie'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                ⭐ {activeMovie.rating.toFixed(1)}
              </span>
              {activeMovie.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] text-zinc-300 border border-white/[0.06]"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis Description */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl line-clamp-3">
              {activeMovie.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onWatchNow(activeMovie)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#7c5cff] hover:bg-[#6a46ff] text-white text-xs sm:text-sm font-extrabold transition-all duration-200 shadow-lg shadow-purple-600/30 hover:scale-[1.02] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Now</span>
              </button>

              <button
                onClick={() => onToggleWatchlist && onToggleWatchlist(activeMovie)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 hover:text-white border border-white/[0.12] text-xs sm:text-sm font-bold backdrop-blur-md transition-all cursor-pointer"
              >
                {isWatchlisted ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Watchlisted</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Watchlist</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onDetails(activeMovie)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-transparent hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <Film className="w-4 h-4" />
                <span>Trailer / Details</span>
              </button>
            </div>

            {/* Dots Pagination */}
            <div className="flex items-center gap-1.5 pt-4">
              {spotlightList.map((m, idx) => (
                <button
                  key={m.id || idx}
                  onClick={() => setActiveMovie(m)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeMovie.id === m.id
                      ? 'w-6 bg-[#7c5cff]'
                      : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Floating Quick Switcher Carousel Stack */}
          {spotlightList.length > 1 && (
            <div className="w-full lg:w-72 space-y-2.5 bg-black/40 backdrop-blur-xl border border-white/[0.1] rounded-2xl p-3 shadow-2xl">
              {spotlightList.map((item, idx) => {
                const isActive = activeMovie.id === item.id;
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => setActiveMovie(item)}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-white/[0.12] border-[#7c5cff]/60 shadow-lg'
                        : 'bg-white/[0.03] border-transparent hover:bg-white/[0.07]'
                    }`}
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-11 h-14 object-cover rounded-lg flex-shrink-0 shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate leading-tight">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {idx === 0 ? (
                          <span className="text-[10px] font-bold text-[#a28bff] bg-[#7c5cff]/20 px-1.5 py-0.5 rounded">
                            Continue Watching
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-medium">
                            New Release • {item.releaseYear}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#7c5cff]' : 'text-zinc-500'}`} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
