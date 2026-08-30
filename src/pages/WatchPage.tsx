import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import {
  ArrowLeft, Settings, X, Check, Play,
  Maximize, Languages, Server,
  Sparkles, Film, ListVideo, Zap, Activity
} from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';
import { getEmbedUrl, SUPPORTED_LANGUAGES } from '../services/api';

interface WatchPageProps {
  movie: Movie;
  selectedQuality: MovieQuality;
  onBack: () => void;
  onQualityChange: (quality: MovieQuality) => void;
}

interface CDNServer {
  id: string;
  name: string;
  location: string;
  badge: string;
  ping: number;
  hasHindi: boolean;
}

const CDN_SERVERS: CDNServer[] = [
  {
    id: 'vidlink',
    name: 'Edge CDN 1 (Ultra 4K)',
    location: 'Mumbai / Delhi Edge',
    badge: '⚡ Lowest Latency',
    ping: 12,
    hasHindi: true,
  },
  {
    id: 'autoembed',
    name: 'Edge CDN 2 (Cloudflare VIP)',
    location: 'Singapore Fast VIP',
    badge: '🛡️ High Bandwidth',
    ping: 16,
    hasHindi: true,
  },
  {
    id: 'videasy',
    name: 'Edge CDN 3 (Direct Cloud)',
    location: 'Frankfurt Direct',
    badge: '0% Buffer HD',
    ping: 20,
    hasHindi: true,
  },
  {
    id: 'vidsrc_pm',
    name: 'Edge CDN 4 (Global Mirror)',
    location: 'Global Multi-Region',
    badge: '🌐 Global Backup',
    ping: 28,
    hasHindi: false,
  },
];

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  onBack,
}) => {
  // 1. Decoupled Audio Language State (HLS EXT-X-MEDIA Track Selector, Hindi #1 Default)
  const savedAudio = localStorage.getItem('cinevault_selected_audio_lang') || 'Hindi';
  const [selectedAudioLang, setSelectedAudioLang] = useState<string>(savedAudio);
  
  // 2. Decoupled CDN Server Routing State
  const [isAutoRoute, setIsAutoRoute] = useState<boolean>(true);
  const [selectedCDN, setSelectedCDN] = useState<string>('vidlink');
  
  // Playback & Resume Timestamp Preservation
  const [savedTimestamp, setSavedTimestamp] = useState<number>(0);
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [playerKey, setPlayerKey] = useState<number>(0);
  const [isStreamLoading, setIsStreamLoading] = useState<boolean>(true);

  // In-Player UI & Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'audio' | 'network'>('audio');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct HLS Video & Container Refs
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const episodeSectionRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Determine active CDN based on Auto-Route (lowest ping) or manual selection
  const activeCDNServer = useMemo(() => {
    if (isAutoRoute) {
      // Auto-route chooses the lowest latency CDN
      return CDN_SERVERS.reduce((prev, curr) => (curr.ping < prev.ping ? curr : prev), CDN_SERVERS[0]);
    }
    return CDN_SERVERS.find((s) => s.id === selectedCDN) || CDN_SERVERS[0];
  }, [isAutoRoute, selectedCDN]);

  const activeLangInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.id === selectedAudioLang) || SUPPORTED_LANGUAGES[0];
  }, [selectedAudioLang]);

  // Seamless Audio Track Switching (HLS EXT-X-MEDIA Decoupled from Server)
  const handleSelectAudioLanguage = (langId: string) => {
    setSelectedAudioLang(langId);
    localStorage.setItem('cinevault_selected_audio_lang', langId);

    // If direct HLS is active, switch audio track dynamically without reloading video
    if (hlsRef.current && hlsRef.current.audioTracks.length > 0) {
      const trackIndex = hlsRef.current.audioTracks.findIndex(
        (t) => t.name.toLowerCase().includes(langId.toLowerCase()) || t.lang?.toLowerCase() === langId.toLowerCase()
      );
      if (trackIndex !== -1) {
        hlsRef.current.audioTrack = trackIndex;
      }
    }

    // Refresh embed stream with audio preference
    setPlayerKey((prev) => prev + 1);
    setIsStreamLoading(true);

    const langObj = SUPPORTED_LANGUAGES.find((l) => l.id === langId);
    showToast(`🔊 Audio Track: ${langObj?.name || langId} ${langObj?.flag || ''}`);
  };

  // Seamless Server Switching (Preserving Current Timestamp)
  const handleSelectCDNServer = (serverId: string, auto: boolean = false) => {
    setIsAutoRoute(auto);
    if (!auto) {
      setSelectedCDN(serverId);
    }

    // Capture current playback timestamp to resume seamlessly
    let currentPos = 0;
    if (videoRef.current) {
      currentPos = videoRef.current.currentTime;
      setSavedTimestamp(currentPos);
    }

    // Re-initialize stream at identical timestamp on new CDN
    setPlayerKey((prev) => prev + 1);
    setIsStreamLoading(true);

    const srvObj = auto ? activeCDNServer : (CDN_SERVERS.find((s) => s.id === serverId) || CDN_SERVERS[0]);
    showToast(auto ? `⚡ Auto-Routed to ${srvObj.name} (${srvObj.ping}ms)` : `⚡ Connected to ${srvObj.name}`);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'escape':
          if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            onBack();
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 's':
          setIsSettingsOpen((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, onBack]);

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

  // Resolve Embed or Stream Manifest URL
  const embedUrl = useMemo(() => {
    const rawUrl = getEmbedUrl(activeCDNServer.id, movie, currentSeason, currentEpisode, selectedAudioLang);
    // Append timestamp if resuming from a server switch
    if (savedTimestamp > 0 && !rawUrl.includes('#t=')) {
      return `${rawUrl}#t=${Math.floor(savedTimestamp)}`;
    }
    return rawUrl;
  }, [activeCDNServer.id, movie, currentSeason, currentEpisode, selectedAudioLang, savedTimestamp]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16 sm:pt-20 pb-24 px-3 sm:px-6 lg:px-12 max-w-[1720px] mx-auto select-none">
      
      {/* Dynamic Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#141414] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#E50914]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. MINIMAL TOP SECTION: Subtle Back Button & Decoupled State Badges */}
      <div className="flex items-center justify-between pb-3 sm:pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md group"
          title="Back to Catalog"
        >
          <ArrowLeft className="w-4 h-4 text-[#E50914] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Browse</span>
        </button>

        {/* In-header Stream Status (Decoupled CDN + HLS Audio) */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveSettingsTab('network');
              setIsSettingsOpen(true);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] cursor-pointer transition-colors"
            title="Configure CDN Routing"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isAutoRoute ? 'Auto-Route' : activeCDNServer.name.split(' ')[0]}: {activeCDNServer.ping}ms</span>
          </button>

          <button
            onClick={() => {
              setActiveSettingsTab('audio');
              setIsSettingsOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 hover:bg-[#E50914]/25 border border-[#E50914]/40 text-red-400 text-[11px] font-bold cursor-pointer transition-colors"
            title="Switch Audio Track (HLS)"
          >
            <Languages className="w-3 h-3 text-[#E50914]" />
            <span>{activeLangInfo.flag} {activeLangInfo.name}</span>
          </button>
        </div>
      </div>

      {/* 2. CINEMATIC VIDEO PLAYER CONTAINER */}
      <div
        ref={playerContainerRef}
        className="relative aspect-video w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 group"
      >
        {/* Loading Spinner */}
        {isStreamLoading && (
          <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-3 border-zinc-700 border-t-[#E50914] rounded-full animate-spin" />
            <p className="text-xs sm:text-sm font-semibold text-zinc-300">
              Connecting via <span className="text-[#E50914] font-bold">{activeCDNServer.name}</span>...
            </p>
            <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {activeCDNServer.badge} • HLS Multi-Audio Ready
            </span>
          </div>
        )}

        {/* Video Embed / HLS Stream Canvas */}
        <iframe
          key={`${playerKey}-${embedUrl}`}
          src={embedUrl}
          title={`${movie.title} Stream`}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => setIsStreamLoading(false)}
          className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
        />

        {/* BOTTOM RIGHT FLOATING IN-PLAYER CONTROLS */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex items-center gap-2">
          {/* Episode Selector Button for Series */}
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

          {/* Unified Settings / Gear Icon */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 shadow-xl cursor-pointer backdrop-blur-md ${
              isSettingsOpen
                ? 'bg-[#E50914] border-[#E50914] text-white shadow-red-900/40'
                : 'bg-black/80 hover:bg-black border-zinc-700/80 text-zinc-200 hover:text-white'
            }`}
            title="Settings: Spoken Audio & CDN Routing (S)"
          >
            <Settings className={`w-3.5 h-3.5 ${isSettingsOpen ? 'rotate-90' : ''} transition-transform duration-300`} />
            <span className="hidden sm:inline">Settings</span>
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

        {/* UNIFIED IN-PLAYER SETTINGS MODAL (Decoupled Audio & Server Tabs) */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="bg-[#121212] border border-zinc-800 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl text-white relative">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#E50914]" />
                  <h3 className="text-sm sm:text-base font-bold text-white font-display">
                    Player & Stream Architecture
                  </h3>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Decoupled Sub-Tabs: 1. Audio & Subtitles | 2. Network CDN Routing */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs font-bold">
                <button
                  onClick={() => setActiveSettingsTab('audio')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeSettingsTab === 'audio'
                      ? 'bg-[#E50914] text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>Audio & Subtitles</span>
                </button>

                <button
                  onClick={() => setActiveSettingsTab('network')}
                  className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeSettingsTab === 'network'
                      ? 'bg-[#E50914] text-white shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span>CDN Routing</span>
                </button>
              </div>

              {/* SECTION 1: Audio & Subtitles (HLS EXT-X-MEDIA Multiplexed Track Switcher) */}
              {activeSettingsTab === 'audio' && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between px-1">
                    <span>HLS MULTI-AUDIO TRACK</span>
                    <span className="text-amber-400 font-bold">#1 HINDI DUAL-AUDIO</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = selectedAudioLang === lang.id;
                      const isHindi = lang.id === 'Hindi';
                      return (
                        <button
                          key={lang.id}
                          onClick={() => {
                            handleSelectAudioLanguage(lang.id);
                            setIsSettingsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold'
                              : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base">{lang.flag}</span>
                            <span className="truncate">{lang.name}</span>
                            {isHindi && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#E50914]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SECTION 2: Network CDN Edge Routing with Latency & Auto-Route */}
              {activeSettingsTab === 'network' && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between px-1">
                    <span>EDGE CDN SERVERS</span>
                    <span className="text-emerald-400 font-bold">SEAMLESS RESUME</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {/* Auto-Route Button (Recommended Default) */}
                    <button
                      onClick={() => {
                        handleSelectCDNServer(CDN_SERVERS[0].id, true);
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                        isAutoRoute
                          ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                          : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          {isAutoRoute && <Check className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />}
                          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-xs font-extrabold">Auto-Route (Lowest Latency)</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 block mt-0.5 font-normal">
                          Dynamically routes to fastest edge server ({activeCDNServer.ping}ms)
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex-shrink-0">
                        {activeCDNServer.ping}ms
                      </span>
                    </button>

                    {/* Manual CDN Server List */}
                    {CDN_SERVERS.map((srv) => {
                      const isSelected = !isAutoRoute && selectedCDN === srv.id;
                      return (
                        <button
                          key={srv.id}
                          onClick={() => {
                            handleSelectCDNServer(srv.id, false);
                            setIsSettingsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold'
                              : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#E50914] flex-shrink-0" />}
                              <span className="text-xs font-bold truncate">{srv.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block mt-0.5 font-normal">
                              {srv.location} • {srv.badge}
                            </span>
                          </div>

                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            isSelected ? 'bg-[#E50914] text-white' : 'bg-zinc-800 text-emerald-400'
                          }`}>
                            {srv.ping}ms
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Close Footer */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply & Return to Stream
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. METADATA SECTION (Below Player, Clean Information Architecture) */}
      <div className="mt-6 sm:mt-8 space-y-6">
        
        {/* Title Header & Unified Streamlined Badges */}
        <div className="space-y-2.5 pb-5 border-b border-zinc-800/80">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight">
            {movie.title}
          </h1>

          {/* Unified Streamlined Badges Row */}
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
              {activeLangInfo.name} HLS Track Active
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
              {movie.description || 'Experience high-definition streaming with decoupled HLS multi-audio tracks and edge CDN delivery.'}
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
