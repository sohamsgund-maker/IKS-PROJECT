import React, { memo } from 'react';
import { Home, Film, Sparkles, Bookmark, Search } from 'lucide-react';

interface NetflixMobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  watchlistCount?: number;
  onOpenSearch: () => void;
}

export const NetflixMobileNav: React.FC<NetflixMobileNavProps> = memo(({
  activeTab,
  setActiveTab,
  watchlistCount = 0,
  onOpenSearch,
}) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'south', label: 'South', icon: Sparkles },
    { id: 'bollywood', label: 'Bollywood', icon: Film },
    { id: 'search', label: 'Search', icon: Search, isAction: true },
    { id: 'watchlist', label: 'My List', icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#121212] border-t border-zinc-800 px-2 py-1.5 pb-safe select-none shadow-2xl">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.isAction ? false : activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isAction) {
                  onOpenSearch();
                } else {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg cursor-pointer relative min-w-[52px] focus:outline-none ${
                isActive ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-[#E50914]' : ''
                  }`}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-[#E50914] text-white text-[9px] font-black rounded-full px-1.5 py-0.2 min-w-[15px] text-center shadow">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
                  isActive ? 'text-white font-bold' : 'text-zinc-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default NetflixMobileNav;
