import React, { useState } from 'react';
import { Play, Info, Volume2, VolumeX, Plus, Check } from 'lucide-react';
import type { Movie } from '../types/movie';

interface NetflixBillboardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onMoreInfo: (movie: Movie) => void;
  onToggleWatchlist?: (movie: Movie) => void;
  isWatchlisted?: boolean;
}

export const NetflixBillboard: React.FC<NetflixBillboardProps> = ({
  movie,
  onPlay,
  onMoreInfo,
  onToggleWatchlist,
  isWatchlisted = false,
}) => {
  const [isMuted, setIsMuted] = useState(true);

  if (!movie) return null;

  return (
    <div className="relative w-full h-[65vh] sm:h-[78vh] lg:h-[88vh] bg-black select-none overflow-hidden">
      {/* Cinematic Edge-to-Edge Backdrop */}
      <div className="absolute inset-0 bg-black">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-top sm:object-center transform scale-105 transition-transform duration-1000 img-smooth"
        />
        {/* Netflix Signature Multi-layered Dark Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-full sm:w-2/3 hidden sm:block" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-black/30 sm:via-[#141414]/30" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
      </div>

      {/* Content Container (Desktop & Mobile Layout) */}
      <div className="relative z-20 max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex flex-col justify-end pb-12 sm:pb-24 lg:pb-28">
        
        {/* Mobile Centered Content Layout (< 640px) */}
        <div className="sm:hidden flex flex-col items-center text-center space-y-3 pb-2">
          {/* N Series / Film Badge */}
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-[#E50914] text-lg">N</span>
            <span className="text-[10px] font-bold text-zinc-300 tracking-[0.2em] uppercase">
              {movie.type === 'series' ? 'SERIES' : 'FILM'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md font-display line-clamp-2 px-2">
            {movie.title}
          </h1>

          {/* Centered Genre Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-zinc-300 font-semibold">
            {movie.genres?.slice(0, 3).map((g, i) => (
              <span key={g} className="flex items-center">
                {g}
                {i < Math.min(2, (movie.genres?.length || 1) - 1) && (
                  <span className="mx-1 text-[#E50914]">•</span>
                )}
              </span>
            ))}
          </div>

          {/* 3-Button Mobile Control Bar */}
          <div className="flex items-center justify-center gap-6 w-full pt-1">
            {/* My List Icon Button */}
            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(movie)}
                className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white cursor-pointer min-w-[50px]"
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
              onClick={() => onPlay(movie)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded bg-white text-black font-extrabold text-sm shadow-xl active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </button>

            {/* Info Icon Button */}
            <button
              onClick={() => onMoreInfo(movie)}
              className="flex flex-col items-center gap-1 text-zinc-200 hover:text-white cursor-pointer min-w-[50px]"
            >
              <Info className="w-5 h-5 text-white" />
              <span className="text-[10px] font-medium">Info</span>
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Left-Aligned Layout (>= 640px) */}
        <div className="hidden sm:flex flex-col max-w-2xl lg:max-w-3xl space-y-4 sm:space-y-6">
          {/* N Series / Film Badge */}
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-[#E50914] text-xl tracking-tighter">N</span>
            <span className="text-[11px] font-bold text-zinc-300 tracking-[0.25em] uppercase">
              {movie.type === 'series' ? 'SERIES' : 'FILM'}
            </span>
          </div>

          {/* Giant Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-2xl font-display">
            {movie.title}
          </h1>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <span className="text-[#46d369] font-bold">98% Match</span>
            <span className="text-zinc-300">{movie.releaseYear}</span>
            <span className="px-1.5 py-0.5 rounded border border-zinc-500 text-[10px] text-zinc-300 font-bold uppercase">
              U/A 16+
            </span>
            <span className="text-zinc-300">{movie.duration}</span>
            <span className="px-1.5 py-0.2 rounded border border-zinc-600 text-[9px] text-zinc-400 font-bold">
              Ultra HD 4K
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm lg:text-base text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-md max-w-xl font-normal">
            {movie.description}
          </p>

          {/* Desktop Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded bg-white hover:bg-white/80 text-black font-extrabold text-sm sm:text-base transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play</span>
            </button>

            <button
              onClick={() => onMoreInfo(movie)}
              className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded bg-zinc-600/70 hover:bg-zinc-600/50 text-white font-bold text-sm sm:text-base transition-all cursor-pointer backdrop-blur-md active:scale-95"
            >
              <Info className="w-5 h-5" />
              <span>More Info</span>
            </button>

            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(movie)}
                className="p-2.5 sm:p-3 rounded-full border border-white/40 hover:border-white text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isWatchlisted ? 'In My List' : 'Add to My List'}
              >
                {isWatchlisted ? <Check className="w-5 h-5 text-[#E50914]" /> : <Plus className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Volume & Maturity Pill (Desktop Right) */}
      <div className="absolute right-0 bottom-24 lg:bottom-28 z-30 hidden sm:flex items-center gap-3 pr-4 sm:pr-8 lg:pr-12">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2.5 rounded-full border border-white/60 hover:border-white text-white bg-black/40 hover:bg-black/60 transition-colors cursor-pointer backdrop-blur-sm"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="bg-zinc-900/80 border-l-3 border-[#E50914] px-3 py-1 text-xs font-bold text-zinc-300 tracking-wider">
          U/A 16+
        </div>
      </div>
    </div>
  );
};
