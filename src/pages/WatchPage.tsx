import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Languages, Server, ChevronDown, Check,
  Activity, Film
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
  peachify: { ping: 18, label: 'Hindi / Multi-Audio 1080p' },
  vidlink: { ping: 14, label: 'Fast CDN 1080p' },
  vidsrc_icu: { ping: 22, label: 'High-Speed Global' },
  autoembed: { ping: 35, label: 'Universal 4K' },
  videasy: { ping: 45, label: 'Clean Player' },
  smashystream: { ping: 48, label: 'Backup Cloud' },
  vidking: { ping: 50, label: 'Ultra HD' },
  vidsrc_to: { ping: 60, label: 'Standard CDN' },
  '2embed': { ping: 65, label: 'TV Multi-Season' },
  direct: { ping: 0, label: 'Direct HTML5' },
};

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  selectedQuality,
  onBack,
}) => {
  // Always default to Hindi Audio Dub
  const savedAudio = localStorage.getItem('cinevault_selected_audio_lang') || 'Hindi';
  const [selectedLanguage, setSelectedLanguage] = useState<string>(savedAudio);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [langToast, setLangToast] = useState<string | null>(null);

  // Default server prioritizes Hindi multi-audio provider (peachify or vidlink)
  const initialServer = useMemo(() => {
    const saved = localStorage.getItem('cinevault_default_server');
    if (saved && STREAMING_SERVERS.some(s => s.id === saved)) {
      return saved;
    }
    return 'peachify';
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

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const seekDelta = (delta: number) => {
    if (videoRef.current) {
      const newTime = Math.min(Math.max(videoRef.current.currentTime + delta, 0), duration || 1000);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const currentEmbedUrl = useMemo(() => {
    return getEmbedUrl(selectedServer, movie, currentSeason, currentEpisode, selectedLanguage);
  }, [selectedServer, movie, currentSeason, currentEpisode, selectedLanguage]);

  const activeServerInfo = STREAMING_SERVERS.find(s => s.id === selectedServer) || STREAMING_SERVERS[0];
  const activeLangInfo = SUPPORTED_LANGUAGES.find(l => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="space-y-6 select-none animate-fade-in pb-16 relative">
      {/* Audio Language Toast Feedback */}
      {langToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#181818] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <span>{langToast}</span>
        </div>
      )}

      {/* 1. Sleek Minimalist Top Navigation Header */}
      <div className="flex items-center justify-between gap-3 py-1 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Browse</span>
        </button>

        {/* Server & Audio Language Dropdowns */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Language Selector Dropdown (Hindi by Default) */}
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
              <div className="absolute right-0 top-10 w-60 sm:w-68 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
                <div className="text-[11px] font-bold text-zinc-400 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
                  <span>SELECT AUDIO LANGUAGE</span>
                  <span className="text-[#E50914] font-bold">DUAL-AUDIO</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = selectedLanguage === lang.id;
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
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Clean Server Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsServerMenuOpen(!isServerMenuOpen);
                setIsLangMenuOpen(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              title="Change Streaming Server"
            >
              <Server className="w-3.5 h-3.5 text-[#E50914]" />
              <span className="max-w-[110px] sm:max-w-none truncate">{activeServerInfo.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isServerMenuOpen && (
              <div className="absolute right-0 top-10 w-64 sm:w-72 bg-[#181818] border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 space-y-1 animate-fade-in">
                <div className="text-[11px] font-bold text-zinc-400 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between">
                  <span>STREAMING SERVER</span>
                  <span className="text-emerald-400 font-mono">ONLINE</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pt-1">
                  {STREAMING_SERVERS.map((srv) => {
                    const isSelected = selectedServer === srv.id;
                    const ping = SERVER_PINGS[srv.id]?.ping ?? 24;
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setSelectedServer(srv.id);
                          setIsServerMenuOpen(false);
                          setPlayerKey(prev => prev + 1);
                          setIsIframeLoading(true);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#E50914] text-white font-bold'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                          <span className="truncate">{srv.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-emerald-400'
                        }`}>
                          {ping}ms
                        </span>
                      </button>
                    );
                  })}
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
                  {/* Play / Pause */}
                  <button
                    onClick={togglePlay}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>

                  {/* 10s Rewind */}
                  <button
                    onClick={() => seekDelta(-10)}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Rewind 10s (←)"
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* 10s Fast-Forward */}
                  <button
                    onClick={() => seekDelta(10)}
                    className="p-1 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Forward 10s (→)"
                  >
                    <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Volume Slider & Mute Toggle */}
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

                  {/* Time Info */}
                  <div className="text-zinc-400 font-mono text-[11px] sm:text-xs">
                    <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                    <span className="mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Right Side: Fullscreen Toggle */}
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
          /* Professional Multi-Server Embed Cloud Stream with Default Hindi Dub */
          <div className="relative w-full h-full bg-black">
            <iframe
              key={`${playerKey}-${selectedServer}-${currentSeason}-${currentEpisode}-${selectedLanguage}`}
              src={currentEmbedUrl}
              className="w-full h-full border-0 absolute inset-0 z-10"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              onLoad={() => setIsIframeLoading(false)}
            />

            {/* Smooth Loading Shimmer */}
            {isIframeLoading && (
              <div className="absolute inset-0 bg-[#121212] flex flex-col items-center justify-center gap-3 z-0">
                <div className="w-10 h-10 border-3 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-zinc-300 tracking-wider uppercase flex items-center gap-2">
                  <span>Loading {activeLangInfo.flag} {activeLangInfo.name} Stream on {activeServerInfo.name}...</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Movie Metadata & Series Episodes Selector */}
      <div className="space-y-6 pt-2">
        {/* Title Header & Quick Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 font-semibold">
              <span className="text-[#46d369] font-bold">98% Match</span>
              <span>{movie.releaseYear}</span>
              <span className="px-1.5 py-0.2 rounded border border-zinc-700 text-[10px] text-zinc-300">
                U/A 16+
              </span>
              <span>{movie.duration}</span>
              <span className="px-1.5 py-0.2 rounded border border-zinc-700 text-[9px] font-bold text-zinc-300">
                Ultra HD 4K
              </span>
              <span className="text-[#E50914] font-bold">
                {activeLangInfo.flag} {activeLangInfo.name}
              </span>
              <span>⭐ {movie.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Stream Quality Status Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>CDN Ping: <strong className="text-white font-mono">{SERVER_PINGS[selectedServer]?.ping ?? 20}ms</strong></span>
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
            <div><strong className="text-zinc-200">Audio Tracks:</strong> Hindi (Default), Telugu, Tamil, Kannada, Malayalam, English</div>
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
              {[1, 2, 3, 4, 5, 6].map((ep) => {
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
