import React, { useState, useEffect, memo } from 'react';
import { Play, Info, Volume2, VolumeX, Plus, Check, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import type { Movie } from '../types/movie';

interface NetflixBillboardProps {
  movie?: Movie;
  movies?: Movie[];
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  isWatchlisted?: boolean;
}

export const NetflixBillboard: React.FC<NetflixBillboardProps> = memo(({
  movie,
  movies,
  onPlay,
  onMoreInfo,
  onToggleWatchlist,
  isWatchlisted = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // If a list of movies is provided, use it for auto-rotation
  const billboardList = movies && movies.length > 0 ? movies : (movie ? [movie] : []);
  const activeMovie = billboardList[currentIndex] || billboardList[0] || movie;

  // Auto-rotate hero banners every 7s unless hovered or page is hidden
  useEffect(() => {
    if (billboardList.length <= 1 || isHovered) return;

    let interval: any = null;
    const startTimer = () => {
      interval = setInterval(() => {
        if (!document.hidden) {
          setCurrentIndex((prev) => (prev + 1) % billboardList.length);
        }
      }, 7000);
    };

    startTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [billboardList.length, isHovered]);

  if (!activeMovie) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + billboardList.length) % billboardList.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % billboardList.length);
  };

  return (
    <div 
      className="relative w-full h-[60vh] sm:h-[75vh] lg:h-[85vh] bg-black select-none overflow-hidden group/billboard"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cinematic Edge-to-Edge Backdrop Banner */}
      <div className="absolute inset-0 bg-black">
        <img
          key={activeMovie.id || activeMovie.tmdbId}
          src={activeMovie.backdropUrl || activeMovie.posterUrl}
          alt={activeMovie.title}
          fetchPriority="high"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (activeMovie.posterUrl && target.src !== activeMovie.posterUrl) {
              target.src = activeMovie.posterUrl;
            }
          }}
          className="w-full h-full object-cover object-top sm:object-center transform scale-100 sm:scale-105 transition-transform duration-700 animate-fade-in img-smooth"
        />
        {/* Netflix Signature Multi-layered Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-transparent w-full sm:w-2/3 hidden sm:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-black/30 sm:via-[#141414]/30" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
      </div>

      {/* Manual Slide Navigation Arrows (Desktop / Tablet) */}
      {billboardList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center transition-all opacity-0 group-hover/billboard:opacity-100 cursor-pointer shadow-lg"
            title="Previous Banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white items-center justify-center transition-all opacity-0 group-hover/billboard:opacity-100 cursor-pointer shadow-lg"
            title="Next Banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Content Container (Desktop & Mobile Layout) */}
      <div className="relative z-20 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex flex-col justify-end pb-10 sm:pb-20 lg:pb-24">
        
        {/* Mobile Centered Content Layout (< 640px) */}
        <div className="sm:hidden flex flex-col items-center text-center space-y-2.5 pb-2">
          {/* N Series / Film Badge with VIP MOD */}
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-[#E50914] text-base">N</span>
            <span className="text-[9px] font-bold text-zinc-300 tracking-[0.2em] uppercase">
              {activeMovie.type === 'series' ? 'SERIES' : 'FILM'}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[9px] font-black uppercase flex items-center gap-0.5 shadow">
              <Crown className="w-2.5 h-2.5 fill-current" />
              <span>VIP 4K</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl font-black text-white tracking-tight leading-tight drop-shadow font-display line-clamp-2 px-2">
            {activeMovie.title}
          </h1>

          {/* Centered Genre Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-zinc-300 font-semibold">
            {activeMovie.genres?.slice(0, 3).map((g, i) => (
              <span key={g} className="flex items-center">
                {g}
                {i < Math.min(2, (activeMovie.genres?.length || 1) - 1) && (
                  <span className="mx-1 text-[#E50914]">•</span>
                )}
              </span>
            ))}
          </div>

          {/* 3-Button Mobile Control Bar */}
          <div className="flex items-center justify-center gap-5 w-full pt-1">
            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(activeMovie)}
                className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white cursor-pointer min-w-[48px]"
              >
                {isWatchlisted ? (
                  <Check className="w-5 h-5 text-[#E50914]" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
                <span className="text-[10px] font-medium">My List</span>
              </button>
            )}

            {/* Prominent Center Play Button */}
            <button
              onClick={() => onPlay(activeMovie)}
              className="flex items-center justify-center gap-2 px-6 py-2 rounded bg-white text-black font-extrabold text-sm shadow-xl active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </button>

            {/* Info Icon Button */}
            <button
              onClick={() => onMoreInfo(activeMovie)}
              className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white cursor-pointer min-w-[48px]"
            >
              <Info className="w-5 h-5 text-white" />
              <span className="text-[10px] font-medium">Info</span>
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Left-Aligned Layout (>= 640px) */}
        <div className="hidden sm:flex flex-col max-w-2xl lg:max-w-3xl space-y-3 sm:space-y-4">
          {/* N Series / Film Badge with VIP MOD */}
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-[#E50914] text-xl tracking-tighter">N</span>
            <span className="text-[11px] font-bold text-zinc-300 tracking-[0.25em] uppercase">
              {activeMovie.type === 'series' ? 'SERIES' : 'FILM'}
            </span>
            <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
              <Crown className="w-3 h-3 fill-current" />
              <span>VIP MOD 4K</span>
            </span>
          </div>

          {/* Giant Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow font-display">
            {activeMovie.title}
          </h1>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className="text-[#46d369] font-bold">98% Match</span>
            <span className="text-zinc-300">{activeMovie.releaseYear}</span>
            <span className="px-1.5 py-0.2 rounded border border-zinc-600 text-[9px] text-zinc-400 font-bold">
              Ultra HD 4K
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#E50914]/20 border border-[#E50914]/40 text-[9px] text-red-400 font-bold">
              {activeMovie.language || 'Hindi Dual Audio'}
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-zinc-200 line-clamp-3 leading-relaxed drop-shadow max-w-xl font-normal">
            {activeMovie.description}
          </p>

          {/* Desktop Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onPlay(activeMovie)}
              className="flex items-center gap-2 px-6 sm:px-7 py-2 sm:py-2.5 rounded bg-white hover:bg-white/80 text-black font-extrabold text-sm transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={() => onMoreInfo(activeMovie)}
              className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded bg-zinc-700/80 hover:bg-zinc-700 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </button>

            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(activeMovie)}
                className="p-2 sm:p-2.5 rounded-full border border-white/40 hover:border-white text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isWatchlisted ? 'In My List' : 'Add to My List'}
              >
                {isWatchlisted ? <Check className="w-4 h-4 text-[#E50914]" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Volume & Carousel Dots (Desktop Right) */}
      <div className="absolute right-0 bottom-20 lg:bottom-24 z-30 hidden sm:flex items-center gap-3 pr-4 sm:pr-8 lg:pr-12">
        {/* Banner Slide Dots */}
        {billboardList.length > 1 && (
          <div className="flex items-center gap-1.5 mr-2">
            {billboardList.slice(0, 8).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-[#E50914]' : 'w-2 bg-zinc-600 hover:bg-zinc-400'
                }`}
                title={`Banner ${idx + 1}`}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full border border-white/60 hover:border-white text-white bg-black/50 hover:bg-black/80 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
});

export default NetflixBillboard;
