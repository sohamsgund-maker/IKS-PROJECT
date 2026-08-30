import React, { useRef, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, Radio, Bell, 
  PlusCircle, RefreshCw, Zap 
} from 'lucide-react';
import type { AuthUser } from '../types/movie';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentUser: AuthUser | null;
  onOpenCustomStream?: () => void;
  onAutoSync?: () => void;
  isSyncing?: boolean;
  onBackHistory?: () => void;
  onForwardHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setActiveTab,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenCustomStream,
  onAutoSync,
  isSyncing,
  onBackHistory,
  onForwardHistory,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#08080d]/80 backdrop-blur-2xl border-b border-white/[0.06] py-3.5 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left History Navigation Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onBackHistory}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onForwardHistory}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Go Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center Prominent Search Bar */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-6">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search movies, shows, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#101018]/90 border border-white/[0.08] focus:border-[#7c5cff] focus:ring-1 focus:ring-[#7c5cff]/40 rounded-2xl py-2 pl-11 pr-10 text-xs sm:text-sm text-white placeholder-zinc-500 transition-all focus:outline-none shadow-inner"
            />
            <div className="absolute right-3.5 px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-zinc-400 pointer-events-none">
              /
            </div>
          </div>
        </div>

        {/* Right Tools & Profile Control */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Auto-Scrape Catalog Button */}
          {onAutoSync && (
            <button
              onClick={onAutoSync}
              disabled={isSyncing}
              title="Auto-Scrape latest releases"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isSyncing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden lg:inline">Scraping...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden lg:inline">Auto-Scrape</span>
                </>
              )}
            </button>
          )}

          {/* Stream Link Button */}
          {onOpenCustomStream && (
            <button
              onClick={onOpenCustomStream}
              title="Stream TMDB ID or Link"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#7c5cff]/15 hover:bg-[#7c5cff]/25 text-[#a28bff] border border-[#7c5cff]/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Stream</span>
            </button>
          )}

          {/* Broadcast / Live Icon */}
          <button 
            onClick={() => setActiveTab('live')}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Live TV Broadcasts"
          >
            <Radio className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <button 
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c5cff] absolute top-2 right-2"></span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <div className="w-6 h-6 rounded-lg bg-[#E50914] flex items-center justify-center text-white font-bold text-xs shadow">
                VIP
              </div>
              <span className="text-xs font-bold text-zinc-200">
                {currentUser ? currentUser.username : 'VIP 4K'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
