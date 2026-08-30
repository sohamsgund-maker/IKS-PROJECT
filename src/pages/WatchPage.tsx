import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Languages, Server, ChevronDown, Check,
  Activity, Film, Sparkles, ShieldCheck
} from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';
import { getEmbedUrl, STREAMING_SERVERS, SUPPORTED_LANGUAGES } from '../services/api';

interface WatchPageProps {
  movie: Movie;
  selectedQuality: MovieQuality;
  onBack: () => void;
  onQualityChange: (quality: MovieQuality) => void;
}

const SERVER_PINGS: Record<string, { ping: number; label: string }> = {
  vidlink: { ping: 12, label: 'Real Hindi Audio & Multi-Audio 1080p' },
  autoembed: { ping: 18, label: 'Universal 4K Hindi Auto-Detect' },
  videasy: { ping: 22, label: 'Clean Player 1080p' },
  moviebox: { ping: 16, label: 'MovieBox VIP CDN' },
  peachify: { ping: 25, label: 'Peachify Fixed 1080p' },
  vidsrc_pm: { ping: 20, label: 'VidSrc Global 1080p' },
  smashystream: { ping: 35, label: 'Backup Cloud' },
  '2embed': { ping: 45, label: 'TV Multi-Season' },
  vidking: { ping: 40, label: 'Ultra HD' },
  direct: { ping: 0, label: 'Direct HTML5' },
};

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  selectedQuality,
  onBack,
}) => {
  // Always default to Hindi Audio Dub as #1 Priority
  const savedAudio = localStorage.getItem('cinevault_selected_audio_lang') || 'Hindi';
  const [selectedLanguage, setSelectedLanguage] = useState<string>(savedAudio);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langToast, setLangToast] = useState<string | null>(null);

  // Default server prioritizes VidLink Ultra (verified real Hindi audio tracks & 0 buffer)
  const initialServer = useMemo(() => {
    const saved = localStorage.getItem('cinevault_default_server');
    if (saved && STREAMING_SERVERS.some(s => s.id === saved && s.id !== 'peachify')) {
      return saved;
    }
    return 'vidlink';
  }, []);

  const [selectedServer, setSelectedServer] = useState<string>(initialServer);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  // Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Controls auto-hide timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Handle Language Change
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'escape':
          if (isFullscreen) {
            document.exitFullscreen?.().catch(() => {});
          } else {
            onBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isPlaying, volume, isMuted]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Time format helper (00:00 or 00:00:00)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const seekDelta = (delta: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(videoRef.current.currentTime + delta, 0), duration);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Resolve Embed URL
  const embedUrl = useMemo(() => {
    return getEmbedUrl(selectedServer, movie, currentSeason, currentEpisode, selectedLanguage);
  }, [selectedServer, movie, currentSeason, currentEpisode, selectedLanguage]);

  const activeServerInfo = STREAMING_SERVERS.find(s => s.id === selectedServer) || STREAMING_SERVERS[0];
  const activeLangInfo = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const hindiServers = STREAMING_SERVERS.filter(s => s.hasHindiAudio);
  const globalServers = STREAMING_SERVERS.filter(s => !s.hasHindiAudio);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-16 sm:pt-20 pb-20 px-3 sm:px-6 lg:px-12 max-w-[1720px] mx-auto select-none">
      
      {/* Toast for Language Switch */}
      {langToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#181818] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <Languages className="w-4 h-4 text-[#E50914]" />
          <span>{langToast}</span>
        </div>
      )}

      {/* 1. Top Navigation & Info Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-5 pb-3 border-b border-zinc-800/80">
        
        {/* Left: Back Button + Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Browse</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black text-white truncate font-display">
              {movie.title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-zinc-400 font-semibold">
              <span className="text-[#46d369] font-bold">98% Match</span>
              <span>{movie.releaseYear}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {activeServerInfo.hasHindiAudio ? '🇮🇳 Hindi Audio Active' : '🌐 Original Audio'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Audio Language Selector + Server Selector */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Audio Language Dropdown (Priority #1: Hindi) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLangMenuOpen(!isLangMenuOpen);
                setIsServerMenuOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-[#E50914]/15 border border-[#E50914]/50 hover:bg-[#E50914]/25 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              title="Change Audio Language"
            >
              <Languages className="w-3.5 h-3.5 text-[#E50914]" />
              <span>{activeLangInfo.flag} {activeLangInfo.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-10 w-64 sm:w-72 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
                <div className="text-[11px] font-bold text-zinc-400 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
                  <span>AUDIO LANGUAGE PRIORITY</span>
                  <span className="text-[#E50914] font-bold">#1 HINDI</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguage === lang.id;
                    const isHindiLang = lang.id === 'Hindi';
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
                          {isHindiLang && (
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

          {/* Server Dropdown with Hindi Availability Status */}
          <div className="relative">
            <button
              onClick={() => {
                setIsServerMenuOpen(!isServerMenuOpen);
                setIsLangMenuOpen(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors cursor-pointer shadow-sm ${
                activeServerInfo.hasHindiAudio
                  ? 'bg-zinc-900 border-emerald-500/50 text-white'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
              title="Change Streaming Server"
            >
              <Server className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="max-w-[120px] sm:max-w-none truncate">{activeServerInfo.name}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                activeServerInfo.hasHindiAudio ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {activeServerInfo.hasHindiAudio ? '🇮🇳 HINDI' : 'GLOBAL'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isServerMenuOpen && (
              <div className="absolute right-0 top-10 w-72 sm:w-80 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-2.5 z-50 space-y-2 animate-fade-in">
                
                {/* Hindi Priority Header */}
                <div className="text-[10px] font-bold text-amber-400 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>HINDI AUDIO PRIORITY SERVERS (#1)</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 pt-0.5">
                  
                  {/* Group 1: Hindi Dubbed & Multi-Audio Servers */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold text-zinc-400 px-2 uppercase tracking-wider">
                      🇮🇳 Hindi Dubbed / Multi-Audio
                    </div>
                    {hindiServers.map((srv) => {
                      const isSelected = selectedServer === srv.id;
                      const ping = SERVER_PINGS[srv.id]?.ping ?? 15;
                      return (
                        <button
                          key={srv.id}
                          onClick={() => {
                            setSelectedServer(srv.id);
                            setIsServerMenuOpen(false);
                            setPlayerKey(prev => prev + 1);
                            setIsIframeLoading(true);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-[#E50914] border-[#E50914] text-white font-bold shadow-md'
                              : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                              <span className="truncate">{srv.name}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 block font-normal mt-0.5">
                              {srv.hindiBadge}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2 flex-shrink-0 ${
                            isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-emerald-400'
                          }`}>
                            {ping}ms
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Group 2: Global Original Audio Servers */}
                  <div className="space-y-1 pt-2 border-t border-zinc-800">
                    <div className="text-[10px] font-extrabold text-zinc-400 px-2 uppercase tracking-wider">
                      🌐 Global Original Audio (Subtitles)
                    </div>
                    {globalServers.map((srv) => {
                      const isSelected = selectedServer === srv.id;
                      const ping = SERVER_PINGS[srv.id]?.ping ?? 35;
                      return (
                        <button
                          key={srv.id}
                          onClick={() => {
                            setSelectedServer(srv.id);
                            setIsServerMenuOpen(false);
                            setPlayerKey(prev => prev + 1);
                            setIsIframeLoading(true);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-[#E50914] border-[#E50914] text-white font-bold shadow-md'
                              : 'bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                              <span className="truncate">{srv.name}</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-normal mt-0.5">
                              {srv.hindiBadge}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-2 flex-shrink-0 ${
                            isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {ping}ms
                          </span>
                        </button>
                      );
                    })}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Professional Cinematic Video Player Container */}
      <div
        ref={playerContainerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative aspect-video w-full bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 group"
      >
        {selectedServer === 'direct' ? (
          /* Custom HTML5 Direct Video Player */
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={selectedQuality.videoUrl}
              autoPlay
              playsInline
              onClick={togglePlay}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* Big Center Play Icon when Paused */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer transition-opacity"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
                </div>
              </div>
            )}

            {/* Auto-Hiding Controls Bar */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Progress Seekbar */}
              <div className="relative flex items-center mb-3">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E50914] hover:h-2 transition-all"
                />
              </div>

              {/* Player Bottom Control Strip */}
              <div className="flex items-center justify-between text-white text-xs sm:text-sm">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={togglePlay}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  <button
                    onClick={() => seekDelta(-10)}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Rewind 10s (←)"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => seekDelta(10)}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Forward 10s (→)"
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <div className="flex items-center gap-2 group/vol">
                    <button
                      onClick={toggleMute}
                      className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                      title="Mute (m)"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  <span className="font-mono text-xs text-zinc-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Fullscreen (f)"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Bufferless Multi-Server Universal Embed Player */
          <div className="relative w-full h-full bg-black">
            {isIframeLoading && (
              <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-3 border-zinc-700 border-t-[#E50914] rounded-full animate-spin" />
                <p className="text-xs sm:text-sm font-semibold text-zinc-300">
                  Connecting to <span className="text-[#E50914] font-bold">{activeServerInfo.name}</span>...
                </p>
                <span className="text-[11px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {activeServerInfo.hindiBadge}
                </span>
              </div>
            )}

            <iframe
              key={`${playerKey}-${embedUrl}`}
              src={embedUrl}
              title={`${movie.title} Player`}
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              onLoad={() => setIsIframeLoading(false)}
              className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
            />
          </div>
        )}
      </div>

      {/* 3. Fast Server Switcher Bar with Hindi Audio Badges */}
      <div className="mt-4 sm:mt-6 bg-[#141414] border border-zinc-800/90 rounded-xl p-3 sm:p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#E50914]" />
            <span className="text-xs sm:text-sm font-bold text-white">Select Streaming Server:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Priority #1: Hindi Audio Supported</span>
            </span>
          </div>
        </div>

        {/* Quick Server Switch Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {STREAMING_SERVERS.map((srv) => {
            const isSelected = selectedServer === srv.id;
            return (
              <button
                key={srv.id}
                onClick={() => {
                  setSelectedServer(srv.id);
                  setPlayerKey(prev => prev + 1);
                  setIsIframeLoading(true);
                }}
                className={`p-2.5 rounded-lg text-left transition-all cursor-pointer border relative flex flex-col justify-between min-h-[64px] ${
                  isSelected
                    ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg font-bold scale-[1.02]'
                    : srv.hasHindiAudio
                    ? 'bg-zinc-900/90 border-emerald-500/40 hover:bg-zinc-800 text-zinc-200'
                    : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold truncate">{srv.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </div>

                <div className="flex items-center justify-between text-[9px] mt-1">
                  <span className={isSelected ? 'text-white font-bold' : srv.hasHindiAudio ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                    {srv.hasHindiAudio ? '🇮🇳 Hindi Audio' : '🌐 Subtitles'}
                  </span>
                  <span className="font-mono opacity-80">{SERVER_PINGS[srv.id]?.ping ?? 20}ms</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Movie Details, Synopsis & TV Series Episode Picker */}
      <div className="mt-6 sm:mt-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">{movie.title}</h2>
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1 font-semibold">
              <span className="text-[#46d369] font-bold">98% Match</span>
              <span>{movie.releaseYear}</span>
              <span>{movie.duration}</span>
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
              <span>CDN Speed: <strong className="text-emerald-400 font-mono">100% Bufferless</strong></span>
            </div>
          </div>
        </div>

        {/* Synopsis & Cast Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Synopsis</h3>
            <p className="text-zinc-300 leading-relaxed text-sm font-normal">
              {movie.description}
            </p>
          </div>

          <div className="space-y-2 text-xs text-zinc-400 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
            <div><strong className="text-zinc-200">Director:</strong> {movie.director || 'Popular Filmmaker'}</div>
            <div><strong className="text-zinc-200">Starring:</strong> {movie.cast?.join(', ') || 'Star Cast'}</div>
            <div><strong className="text-zinc-200">Genres:</strong> {movie.genres?.join(', ')}</div>
            <div><strong className="text-zinc-200">Audio Priority:</strong> <span className="text-amber-400 font-bold">Hindi (Default Priority #1)</span>, Telugu, Tamil, Japanese, Korean, English</div>
          </div>
        </div>

        {/* TV Series Episode Picker (if series) */}
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
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className={`w-4 h-4 ${isCurrentEp ? 'text-[#E50914]' : 'text-white'}`} fill="currentColor" />
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
