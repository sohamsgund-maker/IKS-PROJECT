import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Search, Bell, X, Settings, ChevronDown,
  Bookmark, ShieldCheck, Check
} from 'lucide-react';
import type { AuthUser } from '../types/movie';

interface NetflixNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  currentUser?: AuthUser | null;
  onOpenSettings: () => void;
  watchlistCount?: number;
}

export const NetflixNavbar: React.FC<NetflixNavbarProps> = memo(({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenSettings,
  watchlistCount = 0,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState('Aditya');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Smooth scroll listener
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'south', label: 'South Indian' },
    { id: 'bollywood', label: 'Bollywood' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
    { id: 'kdrama', label: 'K-Dramas' },
    { id: 'watchlist', label: `My List ${watchlistCount > 0 ? `(${watchlistCount})` : ''}` },
  ];

  const profiles = [
    { name: 'Aditya', avatarBg: 'bg-[#E50914]', icon: '🍿' },
    { name: 'Family / Kids', avatarBg: 'bg-emerald-600', icon: '🎨' },
    { name: 'Anime Fan', avatarBg: 'bg-purple-600', icon: '⚔️' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#141414]/98 shadow-2xl border-b border-zinc-800 backdrop-blur-md'
          : 'bg-gradient-to-b from-black/95 via-black/50 to-transparent'
      }`}
    >
      {/* Primary Top Navigation Bar */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left Side: Netflix Logo + Category Links */}
        <div className="flex items-center gap-4 sm:gap-8 lg:gap-10">
          {/* Brand Logo */}
          <button
            onClick={() => {
              setActiveTab('home');
              setSearchQuery('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-1 cursor-pointer select-none group focus:outline-none"
          >
            <span className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter text-[#E50914] uppercase drop-shadow font-display">
              CINEVAULT
            </span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-sm font-medium text-[#e5e5e5]">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id && !searchQuery.trim();
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setSearchQuery('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {/* Right Side: Search, Notifications & User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-4 text-white">
          
          {/* Expandable Search Box */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-black/95 border border-white/80 px-2.5 py-1.5 rounded-md shadow-xl animate-fade-in">
                <Search className="w-4 h-4 text-white mr-2 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Titles, actors, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-400 focus:outline-none w-36 sm:w-64"
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
                title="Search Movies & Shows"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Notifications Bell */}
          <div ref={notifMenuRef} className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileMenuOpen(false);
              }}
              className="p-1.5 sm:p-2 text-white hover:text-zinc-300 transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E50914]" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 w-72 sm:w-80 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-4 space-y-3 z-50 text-xs text-zinc-300 animate-fade-in">
                <div className="font-bold text-white text-sm border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <span>Notifications</span>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <div className="flex gap-3 items-start p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Auto-Sync & Scraper Active</span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5 leading-relaxed">
                        Catalog synchronized with Hindi multi-audio 4K streams in background.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown (The Upgrade!) */}
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => {
                setIsProfileMenuOpen(!isProfileMenuOpen);
                setIsNotificationsOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:outline-none"
              title="User Account & Profiles"
            >
              {/* Netflix Avatar Icon */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#E50914] flex items-center justify-center text-white font-black text-xs shadow-md border border-white/20">
                {activeProfile.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 hidden sm:block transition-transform duration-200 ${
                isProfileMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {/* Netflix Profile Dropdown Modal */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 sm:w-72 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-3 z-50 space-y-3 animate-fade-in text-xs">
                
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-2 bg-zinc-900/80 rounded-lg border border-zinc-800">
                  <div className="w-9 h-9 rounded bg-[#E50914] flex items-center justify-center text-white font-black text-sm shadow">
                    {activeProfile.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm block truncate">{activeProfile}</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>VIP 4K Ultra • Active</span>
                    </span>
                  </div>
                </div>

                {/* Profile Switcher List */}
                <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 block">
                    Switch Profile
                  </span>
                  {profiles.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setActiveProfile(p.name);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded ${p.avatarBg} flex items-center justify-center text-xs shadow`}>
                          {p.icon}
                        </span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                      {activeProfile === p.name && <Check className="w-3.5 h-3.5 text-[#E50914]" />}
                    </button>
                  ))}
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                  <button
                    onClick={() => {
                      setActiveTab('watchlist');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-[#E50914]" />
                    <span>My List ({watchlistCount})</span>
                  </button>

                  <button
                    onClick={() => {
                      onOpenSettings();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span>App & Cache Settings</span>
                  </button>
                </div>

                {/* Footer Sign Out / Status */}
                <div className="pt-2 border-t border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 block">
                    CineVault Pure Web v2.0 • 100% Serverless
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Sub-Header Category Pills (Horizontal Scroll) */}
      <div className="lg:hidden px-3 pb-2 pt-1 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-zinc-800/80 bg-[#141414]">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id && !searchQuery.trim();
          return (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`py-1 px-3 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isActive ? 'bg-[#E50914] text-white font-bold shadow' : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>
    </header>
  );
});

export default NetflixNavbar;
