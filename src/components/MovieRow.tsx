import React, { useRef, useCallback, memo } from 'react';
import type { Movie, MovieShelf } from '../types/movie';
import { MovieCard } from './MovieCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRowProps {
  shelf: MovieShelf;
  onSelectMovie: (movie: Movie) => void;
  priorityRow?: boolean;
}

export const MovieRow: React.FC<MovieRowProps> = memo(({ shelf, onSelectMovie, priorityRow = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    const distance = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  }, []);

  if (!shelf.items || shelf.items.length === 0) return null;

  return (
    <section className="relative py-2.5 sm:py-3.5 cv-lazy-section">
      {/* Shelf Header */}
      <div className="flex items-baseline justify-between px-4 sm:px-6 md:px-8 mb-2 sm:mb-2.5">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#F5F5F2] tracking-tight font-headline">
          {shelf.title}
        </h3>
      </div>

      {/* Row Carousel Area */}
      <div className="relative group/row">
        {/* Desktop Left Scroll Button */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => handleScroll('left')}
          className="hidden md:flex absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-10 h-24 items-center justify-center bg-[#15181D]/90 hover:bg-[#1D2127] active:bg-[#0B0D10] text-[#9A9FA8] hover:text-[#F5F5F2] rounded-r-xl border-y border-r border-[#292E35] opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer shadow-lg press-feedback"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Horizontal Items Container with Scroll-Snap */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 md:px-8 scroll-smooth scroll-snap-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {shelf.items.map((movie, idx) => (
            <div
              key={`${movie.id}_${idx}`}
              className={priorityRow ? 'animate-stagger-in' : ''}
              style={priorityRow ? { animationDelay: `${Math.min(idx * 40, 240)}ms` } : undefined}
            >
              <MovieCard
                movie={movie}
                onSelect={onSelectMovie}
                priority={priorityRow && idx < 6}
              />
            </div>
          ))}
        </div>

        {/* Desktop Right Scroll Button */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => handleScroll('right')}
          className="hidden md:flex absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-10 h-24 items-center justify-center bg-[#15181D]/90 hover:bg-[#1D2127] active:bg-[#0B0D10] text-[#9A9FA8] hover:text-[#F5F5F2] rounded-l-xl border-y border-l border-[#292E35] opacity-0 group-hover/row:opacity-100 transition-all cursor-pointer shadow-lg press-feedback"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
});

MovieRow.displayName = 'MovieRow';
