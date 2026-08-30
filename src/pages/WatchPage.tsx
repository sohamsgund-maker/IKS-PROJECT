import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Languages, Server, ChevronDown, Check,
  Activity, Film, ShieldCheck, Maximize
} from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';
import { getEmbedUrl, SUPPORTED_LANGUAGES } from '../services/api';

interface WatchPageProps {
  movie: Movie;
  selectedQuality: MovieQuality;
  onBack: () => void;
  onQualityChange: (quality: MovieQuality) => void;
}

const STREAM_SERVERS = [
  {
    id: 'vidlink',
    name: 'Server 1: Ultra 4K (Hindi Multi-Audio)',
    badge: '🇮🇳 Real Hindi Dubbed (#1 Default)',
    hasHindi: true,
    ping: 12,
  },
  {
    id: 'autoembed',
    name: 'Server 2: VIP 4K Fast CDN',
    badge: '🇮🇳 Hindi Auto-Detect',
    hasHindi: true,
    ping: 16,
  },
  {
    id: 'videasy',
    name: 'Server 3: Clean Player 1080p',
    badge: '⚡ 0% Buffer Fast HD',
    hasHindi: true,
    ping: 20,
  },
  {
    id: 'vidsrc_pm',
    name: 'Server 4: Global Super Mirror',
    badge: '🌐 Multi-Language Subtitles',
    hasHindi: false,
    ping: 28,
  },
];

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  onBack,
}) => {
  // Always default to Hindi Audio as #1 Priority
  const savedAudio = localStorage.getItem('cinevault_selected_audio_lang') || 'Hindi';
  const [selectedLanguage, setSelectedLanguage] = useState<string>(savedAudio);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langToast, setLangToast] = useState<string | null>(null);

  // Default server: vidlink with multi-audio & Hindi priority
  const [selectedServer, setSelectedServer] = useState<string>('vidlink');
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [playerKey, setPlayerKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);

  // Switch Audio Language
  const handleSelectLanguage = (langId: string) => {
    setSelectedLanguage(langId);
    setIsLangMenuOpen(false);
    localStorage.setItem('cinevault_selected_audio_lang', langId);
    setPlayerKey(prev => prev + 1);
    setIsIframeLoading(true);

    const langObj = SUPPORTED_LANGUAGES.find(l => l.id === langId);
    setLangToast(`🔊 Audio Track: ${langObj?.name || langId} ${langObj?.flag || ''}`);
    setTimeout(() => setLangToast(null), 3000);
  };

  // Keyboard Shortcuts for Laptop/PC Users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          onBack();
        }
      } else if (e.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement && playerRef.current) {
          playerRef.current.requestFullscreen().catch(() => {});
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Resolve Embed URL
  const embedUrl = useMemo(() => {
    return getEmbedUrl(selectedServer, movie, currentSeason, currentEpisode, selectedLanguage);
  }, [selectedServer, movie, currentSeason, currentEpisode, selectedLanguage]);

  const activeServer = STREAM_SERVERS.find(s => s.id === selectedServer) || STREAM_SERVERS[0];
  const activeLang = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-16 sm:pt-20 pb-20 px-3 sm:px-6 lg:px-12 max-w-[1720px] mx-auto select-none">
      
      {/* Toast Notification */}
      {langToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#181818] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <Languages className="w-4 h-4 text-[#E50914]" />
          <span>{langToast}</span>
        </div>
      )}

      {/* Top Controls Bar: Back Button, Title & Audio Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-5 pb-3 border-b border-zinc-800/80">
        {/* Left: Back Button + Title */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex-shrink-0"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-4 h-4 text-[#E50914]" />
            <span className="hidden sm:inline">Back to Browse</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black text-white truncate font-display">
              {movie.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-400 font-semibold mt-0.5">
              <span className="text-[#46d369] font-bold">98% Match</span>
              <span>{movie.releaseYear || '2024'}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {activeServer.hasHindi ? '🇮🇳 Hindi Audio Active' : '🌐 Original Audio'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Audio Language Dropdown (Hindi Default) */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-full bg-[#E50914]/20 border border-[#E50914]/60 hover:bg-[#E50914]/30 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Change Audio Track"
            >
              <Languages className="w-3.5 h-3.5 text-[#E50914]" />
              <span>{activeLang.flag} {activeLang.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-11 w-64 sm:w-72 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
                <div className="text-[11px] font-bold text-zinc-400 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
                  <span>AUDIO LANGUAGE PRIORITY</span>
                  <span className="text-[#E50914] font-bold">#1 HINDI</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguage === lang.id;
                    const isHindi = lang.id === 'Hindi';
                    return (
                      <button
                        key={lang.id}
                        onClick={() => handleSelectLanguage(lang.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#E50914] text-white font-bold'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{lang.flag}</span>
                          <span className="truncate">{lang.name}</span>
                          {isHindi && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                              DEFAULT
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={() => {
              if (playerRef.current) {
                if (!document.fullscreenElement) {
                  playerRef.current.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }
            }}
            className="hidden sm:flex items-center gap-1 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Cinema Container (Ultra-Clean, Mobile & Laptop Optimized) */}
      <div
        ref={playerRef}
        className="relative aspect-video w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80"
      >
        {isIframeLoading && (
          <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-zinc-700 border-t-[#E50914] rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-zinc-300">
              Connecting to <span className="text-[#E50914] font-bold">{activeServer.name}</span>...
            </p>
            <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {activeServer.badge}
            </span>
          </div>
        )}

        <iframe
          key={`${playerKey}-${embedUrl}`}
          src={embedUrl}
          title={`${movie.title} Stream Player`}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => setIsIframeLoading(false)}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
        />
      </div>

      {/* Simplified High-Speed Server Switcher */}
      <div className="mt-4 sm:mt-6 bg-[#141414] border border-zinc-800/90 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#E50914]" />
            <span className="text-xs sm:text-sm font-bold text-white">Select Server If Video Doesn't Play:</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-CDN Bufferless Streaming</span>
          </div>
        </div>

        {/* 4 Clean Server Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {STREAM_SERVERS.map((srv) => {
            const isSelected = selectedServer === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => {
                  setSelectedServer(srv.id);
                  setPlayerKey(prev => prev + 1);
                  setIsIframeLoading(true);
                }}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg font-bold scale-[1.01]'
                    : srv.hasHindi
                    ? 'bg-zinc-900/90 border-emerald-500/40 hover:bg-zinc-800 text-zinc-200'
                    : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="text-xs font-extrabold truncate">{srv.name}</span>
                  </div>
                  <span className={`text-[10px] block font-semibold mt-0.5 ${
                    isSelected ? 'text-white/90' : srv.hasHindi ? 'text-emerald-400' : 'text-zinc-500'
                  }`}>
                    {srv.badge}
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-emerald-400'
                }`}>
                  {srv.ping}ms
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Movie Information, Cast & TV Episodes */}
      <div className="mt-6 sm:mt-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">{movie.title}</h2>
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1 font-semibold flex-wrap">
              <span className="text-[#46d369] font-bold">98% Match</span>
              <span>{movie.releaseYear || '2024'}</span>
              <span>{movie.duration || '2h 15m'}</span>
              <span className="px-1.5 py-0.2 rounded border border-zinc-700 text-[9px] text-zinc-300">
                Ultra HD 4K
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[9px]">
                {movie.language || 'Hindi Dual Audio'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Speed: <strong className="text-emerald-400 font-mono">100% Bufferless</strong></span>
            </div>
          </div>
        </div>

        {/* Synopsis & Cast Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Synopsis</h3>
            <p className="text-zinc-300 leading-relaxed text-sm font-normal">
              {movie.description}
            </p>
          </div>

          <div className="space-y-2 text-xs text-zinc-400 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
            <div><strong className="text-zinc-200">Director:</strong> {movie.director || 'Popular Filmmaker'}</div>
            <div><strong className="text-zinc-200">Starring:</strong> {movie.cast?.join(', ') || 'Star Cast'}</div>
            <div><strong className="text-zinc-200">Genres:</strong> {movie.genres?.join(', ')}</div>
            <div><strong className="text-zinc-200">Audio:</strong> <span className="text-amber-400 font-bold">Hindi (Priority #1)</span>, Telugu, Tamil, Japanese, Korean, English</div>
          </div>
        </div>

        {/* TV Series / Anime Episodes Picker */}
        {movie.type === 'series' && (
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E50914]" />
                <span>Episodes & Seasons</span>
              </h3>

              <select
                value={currentSeason}
                onChange={(e) => {
                  setCurrentSeason(Number(e.target.value));
                  setCurrentEpisode(1);
                  setPlayerKey(prev => prev + 1);
                }}
                className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value={1}>Season 1</option>
                <option value={2}>Season 2</option>
                <option value={3}>Season 3</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((ep) => {
                const isCurrentEp = currentEpisode === ep;
                return (
                  <div
                    key={ep}
                    onClick={() => {
                      setCurrentEpisode(ep);
                      setPlayerKey(prev => prev + 1);
                      setIsIframeLoading(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex gap-3 p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isCurrentEp
                        ? 'bg-[#E50914]/15 border-[#E50914] text-white shadow-lg'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0 relative">
                      <img
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={`Ep ${ep}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className={`text-xs font-bold ${isCurrentEp ? 'text-[#E50914]' : 'text-white'}`}>
                          ▶ Ep {ep}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold truncate">Episode {ep}</h4>
                        <span className="text-[10px] font-mono text-zinc-400">45m</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                        {movie.title} — Part {ep}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchPage;
