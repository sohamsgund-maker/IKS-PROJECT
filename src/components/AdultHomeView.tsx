import React, { useState, useMemo, memo } from 'react';
import type { Movie } from '../types/movie';
import { ADULT_HOME_CATALOG } from '../data/adultCatalog';
import { HeroBanner } from './HeroBanner';
import { MovieRow } from './MovieRow';
import { Flame, X } from 'lucide-react';

interface AdultHomeViewProps {
  onPlayMovie: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
  onExitAdultMode: () => void;
}

export const AdultHomeView: React.FC<AdultHomeViewProps> = memo(({
  onPlayMovie,
  onSelectMovie,
  onExitAdultMode,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredRows = useMemo(() => {
    if (activeCategory === 'all') return ADULT_HOME_CATALOG.rows;
    return ADULT_HOME_CATALOG.rows.filter((shelf) => shelf.id === activeCategory);
  }, [activeCategory]);

  return (
    <div className="view-transition-enter space-y-4">
      {/* 18+ Mode Indicator Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-3">
        <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#15181D] to-[#15181D] border border-red-500/30 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-[#F5F5F2] font-headline">
                  CineVault 18+ Content Vault
                </span>
                <span className="text-[10px] font-mono font-bold bg-red-600/30 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded-md uppercase">
                  Adults Only
                </span>
              </div>
              <p className="text-[11px] text-[#9A9FA8] truncate hidden sm:block">
                Showing uncensored adult dramas, erotic thrillers, late night & web series
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitAdultMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1D2127] hover:bg-[#292E35] active:bg-[#0B0D10] text-xs font-semibold text-[#9A9FA8] hover:text-[#F5F5F2] border border-[#292E35] transition-colors cursor-pointer shrink-0 press-feedback"
            title="Return to standard CineVault"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Exit 18+</span>
          </button>
        </div>
      </div>

      {/* Featured 18+ Premiere Banner */}
      {ADULT_HOME_CATALOG.featured && (
        <HeroBanner
          movie={ADULT_HOME_CATALOG.featured}
          onPlayMovie={onPlayMovie}
          onSelectMovie={onSelectMovie}
        />
      )}

      {/* Category Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap press-feedback ${
              activeCategory === 'all'
                ? 'bg-[#F0B429] text-[#0B0D10] shadow-[0_2px_8px_rgba(240,180,41,0.35)]'
                : 'bg-[#15181D] text-[#9A9FA8] hover:text-[#F5F5F2] border border-[#292E35]'
            }`}
          >
            All 18+ Titles ({ADULT_HOME_CATALOG.total_titles})
          </button>

          {ADULT_HOME_CATALOG.rows.map((shelf) => (
            <button
              key={shelf.id}
              type="button"
              onClick={() => setActiveCategory(shelf.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap press-feedback ${
                activeCategory === 'shelf.id' || activeCategory === shelf.id
                  ? 'bg-[#F0B429] text-[#0B0D10] shadow-[0_2px_8px_rgba(240,180,41,0.35)]'
                  : 'bg-[#15181D] text-[#9A9FA8] hover:text-[#F5F5F2] border border-[#292E35]'
              }`}
            >
              {shelf.title} ({shelf.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Categorized 18+ Content Rows */}
      <div className="mt-2 space-y-2">
        {filteredRows.map((shelf, idx) => (
          <MovieRow
            key={shelf.id}
            shelf={shelf}
            onSelectMovie={onSelectMovie}
            priorityRow={idx < 2}
          />
        ))}
      </div>
    </div>
  );
});

AdultHomeView.displayName = 'AdultHomeView';
