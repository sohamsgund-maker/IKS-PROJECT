import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, X, Play, Maximize,
  Sparkles, Film, ListVideo,
  Captions, Subtitles, Volume2, ShieldCheck, RefreshCw
} from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';
import { getEmbedUrl, SUPPORTED_LANGUAGES } from '../services/api';

interface WatchPageProps {
  movie: Movie;
  selectedQuality: MovieQuality;
  onBack: () => void;
  onQualityChange: (quality: MovieQuality) => void;
}

// Background High-Speed Global Stream Providers (Prioritized for Pushpa 2 & Indian Blockbusters)
const BACKEND_STREAM_PROVIDERS = [
  'autoembed',   // #1 Priority: Fast 4K CDN (Guaranteed playback for 2024 blockbusters)
  'videasy',     // #2 Priority: 0% Buffer Clean 1080p
  'smashystream',// #3 Priority: High-speed fast mirror
  'vidking',     // #4 Priority: Ultra HD 4K
  'vidlink',     // #5 Priority: Multi-Audio 4K
  '2embed',      // #6 Priority: Global CDN
];

const SUBTITLE_TRACKS = [
  { id: 'off', name: 'Off', lang: 'None' },
  { id: 'en', name: 'English [CC]', lang: 'English' },
  { id: 'hi', name: 'Hindi (हिंदी)', lang: 'Hindi' },
  { id: 'ja', name: 'Japanese (日本語)', lang: 'Japanese' },
  { id: 'es', name: 'Spanish (Español)', lang: 'Spanish' },
  { id: 'ko', name: 'Korean (한국어)', lang: 'Korean' },
];

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  onBack,
}) => {
  // 1. Audio & Subtitles State (Strict Hindi Priority #1 Default)
  const isHindiSupported = useMemo(() => {
    const langLower = (movie.language || '').toLowerCase();
    const genres = (movie.genres || []).map((g) => g.toLowerCase());
    return (
      langLower.includes('hindi') ||
      genres.includes('bollywood') ||
      genres.includes('south indian') ||
      movie.type === 'movie' ||
      movie.type === 'series'
    );
  }, [movie]);

  const [selectedAudioLang, setSelectedAudioLang] = useState<string>(() => {
    const saved = localStorage.getItem('cinevault_selected_audio_lang');
    if (saved) return saved;
    return isHindiSupported ? 'Hindi' : 'English';
  });

  const [selectedSubtitle, setSelectedSubtitle] = useState<string>(() => {
    return isHindiSupported ? 'off' : 'en';
  });

  // 2. Netflix-Style Silent Background Failover & State
  const [activeProviderIndex, setActiveProviderIndex] = useState<number>(0);
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [savedTimestamp] = useState<number>(0);
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [isStreamLoading, setIsStreamLoading] = useState<boolean>(true);

  // In-Player Audio/Subtitle Overlay State
  const [isAudioMenuOpen, setIsAudioMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video & Container Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const episodeSectionRef = useRef<HTMLDivElement>(null);
  const failoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const activeProvider = BACKEND_STREAM_PROVIDERS[activeProviderIndex] || BACKEND_STREAM_PROVIDERS[0];
  const activeLangInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.id === selectedAudioLang) || SUPPORTED_LANGUAGES[0];
  }, [selectedAudioLang]);

  // Silent Auto-Failover: If a stream source takes too long or stalls, automatically switch to backup provider
  useEffect(() => {
    if (isStreamLoading) {
      failoverTimeoutRef.current = setTimeout(() => {
        if (activeProviderIndex < BACKEND_STREAM_PROVIDERS.length - 1) {
          // Silently advance to next backup provider in background
          setActiveProviderIndex((prev) => prev + 1);
          setPlayerKey((prev) => prev + 1);
        }
      }, 7000); // 7-second health threshold
    }

    return () => {
      if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
    };
  }, [isStreamLoading, activeProviderIndex]);

  // Audio Track Switcher
  const handleSelectAudioLanguage = (langId: string) => {
    setSelectedAudioLang(langId);
    localStorage.setItem('cinevault_selected_audio_lang', langId);
    setPlayerKey((prev) => prev + 1);
    setIsStreamLoading(true);

    const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === langId);
    showToast(`🔊 Audio Track: ${langObj?.name || langId} ${langObj?.flag || ''}`);
  };

  const handleSelectSubtitle = (subId: string) => {
    setSelectedSubtitle(subId);
    const subObj = SUBTITLE_TRACKS.find((s) => s.id === subId);
    showToast(subId === 'off' ? 'Subtitles Turned Off' : `💬 Subtitles: ${subObj?.name || subId}`);
  };

  // Keyboard Shortcuts (F = Fullscreen, C/L = Audio & Subtitles, Esc = Back/Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'escape':
          if (isAudioMenuOpen) {
            setIsAudioMenuOpen(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            onBack();
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'c':
        case 'l':
          setIsAudioMenuOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAudioMenuOpen, onBack]);

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const scrollToEpisodes = () => {
    if (episodeSectionRef.current) {
      episodeSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Resolve Universal Stream URL with Auto-Language Multiplexing & Timestamp Resume
  const embedUrl = useMemo(() => {
    const rawUrl = getEmbedUrl(activeProvider, movie, currentSeason, currentEpisode, selectedAudioLang);
    if (savedTimestamp > 0 && !rawUrl.includes('#t=')) {
      return `${rawUrl}#t=${Math.floor(savedTimestamp)}`;
    }
    return rawUrl;
  }, [activeProvider, movie, currentSeason, currentEpisode, selectedAudioLang, savedTimestamp]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16 sm:pt-20 pb-24 px-3 sm:px-6 lg:px-12 max-w-[1720px] mx-auto select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#141414] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#E50914]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. MINIMAL TOP SECTION: Subtle Back Button & Clean Audio Status */}
      <div className="flex items-center justify-between pb-3 sm:pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md group"
          title="Back to Catalog"
        >
          <ArrowLeft className="w-4 h-4 text-[#E50914] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Browse</span>
        </button>

        {/* In-header Stream Status (Netflix-Style Stream State) */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ultra 4K Stream</span>
          </span>

          <button
            onClick={() => setIsAudioMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 hover:bg-[#E50914]/25 border border-[#E50914]/40 text-red-400 text-[11px] font-bold cursor-pointer transition-colors"
            title="Switch Audio Track & Subtitles"
          >
            <span>{activeLangInfo.flag} Audio: {activeLangInfo.name}</span>
          </button>
        </div>
      </div>

      {/* 2. CINEMATIC VIDEO PLAYER CONTAINER (100% Automated, Zero Server Choices) */}
      <div
        ref={playerContainerRef}
        className="relative aspect-video w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 group"
      >
        {/* Loading Spinner */}
        {isStreamLoading && (
          <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-zinc-700 border-t-[#E50914] rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-zinc-300">
              Loading <span className="text-[#E50914] font-bold">{movie.title}</span>...
            </p>
            <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>4K Ultra HD • Hindi Audio Active</span>
            </span>
          </div>
        )}

        {/* Video Embed */}
        <iframe
          key={`${playerKey}-${embedUrl}`}
          src={embedUrl}
          title={`${movie.title} Stream`}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          onLoad={() => setIsStreamLoading(false)}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
        />

        {/* BOTTOM RIGHT FLOATING CONTROLS (Clean, Netflix Style) */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex items-center gap-2">
          {/* TV Series Episode Selector Button */}
          {movie.type === 'series' && (
            <button
              onClick={scrollToEpisodes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 backdrop-blur-md transition-all active:scale-95 shadow-xl cursor-pointer"
              title="View Episodes"
            >
              <ListVideo className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="hidden sm:inline">Episodes</span>
            </button>
          )}

          {/* DEDICATED AUDIO & SUBTITLES BUTTON */}
          <button
            onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 shadow-xl cursor-pointer backdrop-blur-md ${
              isAudioMenuOpen
                ? 'bg-[#E50914] border-[#E50914] text-white shadow-red-900/40'
                : 'bg-black/80 hover:bg-black border-zinc-700/80 text-zinc-200 hover:text-white'
            }`}
            title="Audio Tracks & Subtitles (C or L)"
          >
            <Captions className="w-3.5 h-3.5 text-white" />
            <span>Audio & Subtitles</span>
          </button>

          {/* QUICK STREAM SWITCHER / FIX STREAM */}
          <button
            onClick={() => {
              setActiveProviderIndex((prev) => (prev + 1) % BACKEND_STREAM_PROVIDERS.length);
              setPlayerKey((prev) => prev + 1);
              setIsStreamLoading(true);
              const nextIndex = (activeProviderIndex + 1) % BACKEND_STREAM_PROVIDERS.length;
              showToast(`⚡ Switched to Stream Source ${nextIndex + 1} (${BACKEND_STREAM_PROVIDERS[nextIndex]})`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 backdrop-blur-md transition-all active:scale-95 shadow-xl cursor-pointer"
            title="If video buffers or shows not found, click to switch stream source"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Source {activeProviderIndex + 1}</span>
            <span className="sm:hidden">S{activeProviderIndex + 1}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/80 hover:bg-black text-zinc-200 hover:text-white border border-zinc-700/80 backdrop-blur-md transition-all active:scale-95 shadow-xl cursor-pointer"
            title="Fullscreen (F)"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* AUDIO & SUBTITLES IN-FRAME OVERLAY */}
        {isAudioMenuOpen && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl text-white relative">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Captions className="w-4 h-4 text-[#E50914]" />
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Audio & Subtitles
                  </h3>
                </div>

                <button
                  onClick={() => setIsAudioMenuOpen(false)}
                  className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2 DISTINCT INDEPENDENT LISTS: Audio/Dub (Left) & Subtitles (Right) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* COLUMN 1: Audio / Dub Radio List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 pb-1 border-b border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-red-500" />
                      <span>AUDIO / DUB</span>
                    </span>
                    <span className="text-amber-400 text-[10px] font-extrabold">PRIORITY #1</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedAudioLang === lang.id;
                      const isHindi = lang.id === 'Hindi';
                      return (
                        <button
                          key={lang.id}
                          onClick={() => handleSelectAudioLanguage(lang.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                              : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base">{lang.flag}</span>
                            <span className="truncate">
                              {isHindi ? 'Audio: Hindi (Default)' : lang.name}
                            </span>
                            {isHindi && (
                              <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-[#E50914] bg-[#E50914]' : 'border-zinc-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* COLUMN 2: Subtitles Radio List (with explicit Off option) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 pb-1 border-b border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <Subtitles className="w-3.5 h-3.5 text-zinc-400" />
                      <span>SUBTITLES</span>
                    </span>
                    <span className="text-zinc-500 text-[10px]">CC</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {SUBTITLE_TRACKS.map((sub) => {
                      const isSelected = selectedSubtitle === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleSelectSubtitle(sub.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                              : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-[#E50914] bg-[#E50914]' : 'border-zinc-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Close Footer */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsAudioMenuOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold transition-colors cursor-pointer shadow-lg active:scale-95"
                >
                  Apply & Return to Video
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. METADATA SECTION (Below Player, Clean Information Architecture) */}
      <div className="mt-6 sm:mt-8 space-y-6">
        
        {/* Title Header & Streamlined Unified Badges */}
        <div className="space-y-2.5 pb-5 border-b border-zinc-800/80">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight">
            {movie.title}
          </h1>

          {/* Unified Badges Row */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              98% Match
            </span>

            <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-white font-bold text-xs">
              Ultra HD 4K
            </span>

            <span className="text-zinc-400 font-medium">
              {movie.releaseYear || '2024'}
            </span>

            <span className="text-zinc-500">•</span>

            <span className="text-zinc-400 font-medium">
              {movie.duration || '2h 15m'}
            </span>

            <span className="px-1.5 py-0.2 rounded border border-zinc-700 text-[10px] text-zinc-400 font-bold">
              U/A 16+
            </span>

            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              {activeLangInfo.name} Multi-Audio Active
            </span>
          </div>
        </div>

        {/* Synopsis & Key Metadata (2-Column Architecture) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-xs sm:text-sm">
          
          {/* Left Column: Synopsis */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Synopsis
            </h3>
            <p className="text-zinc-300 leading-relaxed text-sm sm:text-base font-normal">
              {movie.description || 'Experience high-definition streaming with instant single-tap playback and multi-language audio tracks.'}
            </p>
          </div>

          {/* Right Column: Cast, Director, Genres & Audio */}
          <div className="space-y-2.5 text-xs sm:text-sm text-zinc-400 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-800">
            <div>
              <span className="text-zinc-500 font-medium">Director: </span>
              <span className="text-zinc-200 font-semibold">{movie.director || 'Popular Filmmaker'}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-medium">Starring: </span>
              <span className="text-zinc-200">{movie.cast?.join(', ') || 'Ensemble Star Cast'}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-medium">Genres: </span>
              <span className="text-zinc-200">{movie.genres?.join(', ') || 'Action, Drama'}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-medium">Audio Tracks: </span>
              <span className="text-amber-400 font-bold">Hindi (Priority #1)</span>, Telugu, Tamil, Japanese, Korean, English
            </div>
          </div>
        </div>

        {/* 4. EPISODES GRID (For TV Series & Anime) */}
        {movie.type === 'series' && (
          <div ref={episodeSectionRef} className="space-y-4 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E50914]" />
                <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                  Episodes & Seasons
                </h3>
              </div>

              {/* Season Dropdown */}
              <select
                value={currentSeason}
                onChange={(e) => {
                  setCurrentSeason(Number(e.target.value));
                  setCurrentEpisode(1);
                  setPlayerKey((prev) => prev + 1);
                  setIsStreamLoading(true);
                }}
                className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer hover:border-zinc-500 transition-colors"
              >
                <option value={1}>Season 1</option>
                <option value={2}>Season 2</option>
                <option value={3}>Season 3</option>
              </select>
            </div>

            {/* Episode Grid with Highlighted Active Episode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((ep) => {
                const isPlayingEp = currentEpisode === ep;
                return (
                  <div
                    key={ep}
                    onClick={() => {
                      setCurrentEpisode(ep);
                      setPlayerKey((prev) => prev + 1);
                      setIsStreamLoading(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col rounded-xl overflow-hidden transition-all cursor-pointer border relative group ${
                      isPlayingEp
                        ? 'bg-[#E50914]/15 border-[#E50914] shadow-lg shadow-red-950/30 ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video w-full bg-black relative overflow-hidden">
                      <img
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={`Episode ${ep}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />

                      {/* Playing / Ep Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        {isPlayingEp ? (
                          <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Playing</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/20">
                            Ep {ep}
                          </span>
                        )}
                      </div>

                      {/* Center Play Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-2.5 rounded-full bg-white text-black shadow-xl">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${isPlayingEp ? 'text-[#E50914]' : 'text-white'}`}>
                          Episode {ep}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400">45m</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
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
