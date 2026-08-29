import React from 'react';
import { 
  Home, Search, Film, Tv, Sparkles, Radio, Flame, Bookmark, 
  Clock, Compass, Clapperboard, Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  watchlistCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenSettings,
  watchlistCount = 0,
}) => {
  return (
    <aside className="w-56 lg:w-60 flex-shrink-0 bg-[#08080d]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col py-6 px-3 min-h-screen select-none">
      {/* Brand Logo Header */}
      <div 
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-3 px-3 pb-6 border-b border-white/[0.06] cursor-pointer group"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c5cff] via-[#6342f5] to-[#4023c7] flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-105 transition-transform">
          <Clapperboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-white text-base tracking-tight leading-tight flex items-center gap-1">
            Cine<span className="text-[#7c5cff]">Vault</span>
          </h1>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wide">
            Next-Gen Streaming
          </p>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 space-y-6 pt-5 overflow-y-auto scrollbar-none">
        {/* Core Nav */}
        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#7c5cff] text-white shadow-lg shadow-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              if (onOpenSearch) onOpenSearch();
              else setActiveTab('search');
            }}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#7c5cff] text-white shadow-lg shadow-purple-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </div>

        {/* BROWSE Section */}
        <div className="space-y-1">
          <h3 className="px-3.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5">
            BROWSE
          </h3>

          {[
            { id: 'movies', label: 'Movies', icon: Film },
            { id: 'series', label: 'Series', icon: Tv },
            { id: 'anime', label: 'Anime', icon: Sparkles },
            { id: 'south', label: 'South Indian', icon: Compass },
            { id: 'bollywood', label: 'Bollywood', icon: Globe },
            { id: 'live', label: 'Live TV', icon: Radio },
            { id: 'trending', label: 'Trending', icon: Flame },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#7c5cff] text-white font-bold shadow-lg shadow-purple-500/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* LIBRARY Section */}
        <div className="space-y-1">
          <h3 className="px-3.5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1.5">
            LIBRARY
          </h3>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-[#7c5cff] text-white font-bold shadow-lg shadow-purple-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Bookmark className="w-4 h-4" />
              <span>Watchlist</span>
            </div>
            {watchlistCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.1] text-[10px] font-bold text-zinc-300">
                {watchlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#7c5cff] text-white font-bold shadow-lg shadow-purple-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>

        {/* SETTINGS Section */}
        {onOpenSettings && (
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <span className="w-4 h-4 flex items-center justify-center">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
