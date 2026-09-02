import React, { useState, useEffect, useRef, memo } from 'react';
import { Search, Bell, X, Settings, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import type { AuthUser } from '../types/movie';

interface NetflixNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentUser?: AuthUser | null;
  onOpenSettings: () => void;
  watchlistCount?: number;
  onSyncMovieBox?: () => void;
  isSyncingMovieBox?: boolean;
}

export const NetflixNavbar: React.FC<NetflixNavbarProps> = memo(({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenSettings,
  watchlistCount = 0,
  onSyncMovieBox,
  isSyncingMovieBox = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCategoriesMenuOpen, setIsCategoriesMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 25);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'moviebox', label: 'MovieBox VIP' },
    { id: 'south', label: 'South Indian' },
    { id: 'bollywood', label: 'Bollywood' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
    { id: 'kdrama', label: 'K-Dramas' },
    { id: 'watchlist', label: `My List ${watchlistCount > 0 ? `(${watchlistCount})` : ''}` },
  ];

  const categories = [
    { id: 'home', label: 'Home' },
    { id: 'moviebox', label: '🎬 MovieBox VIP Streams' },
    { id: 'south', label: '🏹 South Indian Blockbusters' },
    { id: 'bollywood', label: '🇮🇳 Bollywood (Hindi Cinema)' },
    { id: 'movies', label: '🌍 Hollywood & Global Hits' },
    { id: 'series', label: '📺 TV Shows & Web Series' },
    { id: 'anime', label: '⚔️ Anime Spotlight' },
    { id: 'kdrama', label: '🇰🇷 K-Dramas & Korean Cinema' },
    { id: 'watchlist', label: `❤️ My List (${watchlistCount})` },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        isScrolled
          ? 'bg-[#141414]/98 shadow-xl border-b border-zinc-800'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}
    >
      {/* Primary Top Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Side: Brand Logo + Primary Nav Links */}
        <div className="flex items-center gap-4 sm:gap-8 lg:gap-10">
          {/* Netflix Red Logo */}
          <button
            onClick={() => {
              setActiveTab('home');
              setSearchQuery('');
            }}
            className="flex items-center gap-1 cursor-pointer select-none group focus:outline-none"
          >
            <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter text-[#E50914] uppercase drop-shadow font-display">
              CINEVAULT
            </span>
          </button>

          {/* Desktop Navigation Links (Laptop / PC) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-medium text-[#e5e5e5]">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id && !searchQuery.trim();
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setSearchQuery('');
                  }}
                  className={`transition-colors cursor-pointer whitespace-nowrap focus:outline-none ${
                    isActive
                      ? 'text-white font-bold border-b-2 border-[#E50914] pb-0.5'
                      : 'text-[#b3b3b3] hover:text-[#e5e5e5]'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: MovieBox Sync, Search, Notifications, Settings */}
        <div className="flex items-center gap-2 sm:gap-4 text-white">
          {/* MovieBox Scraper Live Sync Button */}
          {onSyncMovieBox && (
            <button
              onClick={onSyncMovieBox}
              disabled={isSyncingMovieBox}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer shadow-lg ${
                isSyncingMovieBox
                  ? 'bg-amber-600/80 text-white cursor-wait'
                  : 'bg-gradient-to-r from-[#E50914] to-red-700 hover:brightness-110 text-white'
              }`}
              title="Scrape & Sync MovieBox Movies"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMovieBox ? 'animate-spin' : ''}`} />
              <span>{isSyncingMovieBox ? 'Syncing...' : 'Sync MovieBox'}</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-black/95 border border-white/80 px-2.5 py-1.5 rounded-sm shadow-xl">
                <Search className="w-4 h-4 text-white mr-2 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search MovieBox, titles, stars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none w-36 sm:w-60"
                />
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="text-zinc-400 hover:text-white p-0.5 cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 sm:p-2 text-white hover:text-zinc-300 transition-colors cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* VIP 4K Badge */}
          <span className="hidden md:inline-block text-xs font-bold text-[#e5e5e5] hover:text-white cursor-pointer select-none bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
            MOVIEBOX VIP
          </span>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-1.5 sm:p-2 text-white hover:text-zinc-300 transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E50914]" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 w-72 sm:w-80 bg-[#181818] border border-zinc-700/60 rounded-md shadow-2xl p-4 space-y-3 z-50 text-xs text-zinc-300 animate-fade-in">
                <div className="font-bold text-white text-sm border-b border-zinc-700/60 pb-2 flex items-center justify-between">
                  <span>Notifications</span>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <div className="flex gap-3 items-start hover:bg-zinc-800/50 p-1.5 rounded transition-colors cursor-pointer">
                    <div className="p-2 bg-red-600/20 text-[#E50914] rounded">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">MovieBox Auto-Scraper Active</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        Scraping newest HD movie streams & multi-language dubs.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Header Category Pills */}
      <div className="lg:hidden px-4 pb-2 pt-0.5 flex items-center justify-around text-xs font-semibold border-t border-zinc-800/80 bg-[#141414]">
        <button
          onClick={() => {
            setActiveTab('moviebox');
            setSearchQuery('');
          }}
          className={`py-1 px-3 rounded-full transition-colors cursor-pointer ${
            activeTab === 'moviebox' ? 'bg-[#E50914] text-white font-bold' : 'text-zinc-300 hover:text-white'
          }`}
        >
          MovieBox VIP
        </button>

        <button
          onClick={() => {
            setActiveTab('movies');
            setSearchQuery('');
          }}
          className={`py-1 px-3 rounded-full transition-colors cursor-pointer ${
            activeTab === 'movies' ? 'bg-white text-black font-bold' : 'text-zinc-300 hover:text-white'
          }`}
        >
          Movies
        </button>

        <button
          onClick={() => setIsCategoriesMenuOpen(true)}
          className="flex items-center gap-1 py-1 px-3 rounded-full text-zinc-300 hover:text-white border border-zinc-700 bg-zinc-900 cursor-pointer"
        >
          <span>Categories</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mobile Categories Modal / Drawer */}
      {isCategoriesMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/90 flex flex-col justify-end p-4 animate-fade-in">
          <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-5 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E50914]" />
                <span>Explore Categories</span>
              </span>
              <button
                onClick={() => setIsCategoriesMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveTab(cat.id);
                    setIsCategoriesMenuOpen(false);
                    setSearchQuery('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    activeTab === cat.id ? 'bg-[#E50914] text-white font-bold' : 'bg-zinc-800/70 text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span>›</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

export default NetflixNavbar;
