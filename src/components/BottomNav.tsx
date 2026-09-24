import React, { memo, useCallback } from 'react';
import { Film, Search, Award, Download, Tv } from 'lucide-react';

interface BottomNavProps {
  activeView: 'home' | 'livetv' | 'downloads' | 'profile';
  onNavigate: (view: 'home' | 'livetv' | 'downloads' | 'profile') => void;
  onOpenSearch: () => void;
  downloadCount?: number;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
  isLive?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = memo(({ icon, label, isActive, badge, isLive, onClick }) => {
  const handleTap = useCallback(() => {
    // Haptic feedback for native feel — non-blocking
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    onClick();
  }, [onClick]);

  return (
    <button
      type="button"
      onClick={handleTap}
      className={`relative flex flex-col items-center justify-center flex-1 max-w-[72px] min-h-[48px] px-1 rounded-2xl transition-colors duration-150 cursor-pointer press-feedback ${
        isActive
          ? 'text-[#F0B429]'
          : 'text-[#6B7280] active:text-[#F5F5F2]'
      }`}
    >
      {/* Active indicator pill (Material 3 style) */}
      {isActive && (
        <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-[#F0B429] animate-scale-in" />
      )}

      {/* Icon with badge */}
      <span className="relative flex items-center justify-center">
        {icon}
        {isLive && (
          <span className="absolute -top-1.5 -right-3 px-1 py-[0.5px] bg-red-600 text-white text-[7.5px] font-black tracking-wider uppercase rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)] leading-none">
            LIVE
          </span>
        )}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold bg-[#F0B429] text-[#0B0D10] leading-[16px] text-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>

      {/* Label */}
      <span className={`text-[10px] mt-0.5 font-semibold tracking-wide transition-colors duration-150 ${
        isActive ? 'text-[#F0B429]' : 'text-[#6B7280]'
      }`}>
        {label}
      </span>
    </button>
  );
});
NavItem.displayName = 'NavItem';

export const BottomNav: React.FC<BottomNavProps> = memo(({
  activeView,
  onNavigate,
  onOpenSearch,
  downloadCount = 0,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-40 md:hidden bg-[#0B0D10]/95 backdrop-blur-md border-t border-[#292E35]/60 flex items-center justify-around sm:justify-center sm:gap-2 px-1.5 pt-1 shadow-[0_-4px_16px_rgba(0,0,0,0.4)] bottom-nav-safe"
      role="tablist"
      aria-label="Main navigation"
    >
      <NavItem
        icon={<Film className={`w-[21px] h-[21px] ${activeView === 'home' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />}
        label="Vault"
        isActive={activeView === 'home'}
        onClick={() => onNavigate('home')}
      />

      <NavItem
        icon={<Tv className={`w-[21px] h-[21px] ${activeView === 'livetv' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />}
        label="Live TV"
        isActive={activeView === 'livetv'}
        isLive={true}
        onClick={() => onNavigate('livetv')}
      />

      <NavItem
        icon={<Search className="w-[21px] h-[21px] stroke-[1.8]" />}
        label="Explore"
        isActive={false}
        onClick={onOpenSearch}
      />

      <NavItem
        icon={<Download className={`w-[21px] h-[21px] ${activeView === 'downloads' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />}
        label="Downloads"
        isActive={activeView === 'downloads'}
        badge={downloadCount}
        onClick={() => onNavigate('downloads')}
      />

      <NavItem
        icon={<Award className={`w-[21px] h-[21px] ${activeView === 'profile' ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />}
        label="Privé"
        isActive={activeView === 'profile'}
        onClick={() => onNavigate('profile')}
      />
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
