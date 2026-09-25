import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Radio,
  Tv,
  Film,
  Trophy,
  Music,
  Smile,
  Compass,
  Sparkles,
  Search,
  RotateCcw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Globe,
} from 'lucide-react';
import {
  liveTvService,
  LIVE_CATEGORIES,
} from '../services/liveTvService';
import type { ChannelCategory, LiveChannel } from '../services/liveTvService';

interface LiveTvViewProps {
  onSelectMovie?: (movie: any) => void;
}

export const LiveTvView: React.FC<LiveTvViewProps> = memo(() => {
  const allChannels: LiveChannel[] = useMemo(() => liveTvService.getChannels(), []);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<LiveChannel>(allChannels[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [needsUnmute, setNeedsUnmute] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Track portrait orientation of the phone screen
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight >= window.innerWidth;
    }
    return true;
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure Android app activity stays locked in portrait mode at all times
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).AndroidDevice?.setOrientation) {
      try {
        (window as any).AndroidDevice.setOrientation('portrait');
        (window as any).AndroidDevice.setFullscreen(false);
      } catch {}
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).AndroidDevice?.setOrientation) {
        try {
          (window as any).AndroidDevice.setOrientation('portrait');
          (window as any).AndroidDevice.setFullscreen(false);
        } catch {}
      }
    };
  }, []);

  // Update portrait flag on resize or device rotation
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight >= window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Filtered Channels based on Category and Search Query
  const filteredChannels = useMemo(() => {
    let list = allChannels;
    if (selectedCategory !== 'all') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.currentProgram.toLowerCase().includes(q) ||
          c.language.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allChannels, selectedCategory, searchQuery]);

  // Controls auto-hide timer
  const triggerShowControls = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3500);
  }, []);

  // Safe Autoplay function with muted fallback
  const startAutoplay = useCallback(async (video: HTMLVideoElement) => {
    try {
      video.muted = isMuted;
      await video.play();
      setIsPlaying(true);
      setIsLoading(false);
      setNeedsUnmute(false);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        video.muted = true;
        setIsMuted(true);
        setNeedsUnmute(true);
        try {
          await video.play();
          setIsPlaying(true);
          setIsLoading(false);
        } catch {
          setIsLoading(false);
          setIsPlaying(false);
        }
      } else {
        setIsLoading(false);
      }
    }
  }, [isMuted]);

  // Load & Stream the Active Channel
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeChannel) return;

    setIsLoading(true);
    setError(null);
    setShowControls(true);

    let currentLoadedUrl = activeChannel.streamUrl;
    let retryAttempts = 0;
    const maxRetries = 3;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // 1. Try HLS.js when supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        startFragPrefetch: true,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.5,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 4,
      });
      hlsRef.current = hls;

      hls.loadSource(currentLoadedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startAutoplay(video);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          return;
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (activeChannel.fallbackUrl && currentLoadedUrl !== activeChannel.fallbackUrl) {
                currentLoadedUrl = activeChannel.fallbackUrl;
                retryAttempts = 0;
                hls.loadSource(activeChannel.fallbackUrl);
                hls.startLoad();
              } else if (retryAttempts < maxRetries) {
                retryAttempts++;
                hls.startLoad();
              } else {
                hls.destroy();
                setError('Live stream connection failed. Tap Retry to reconnect.');
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              if (activeChannel.fallbackUrl && currentLoadedUrl !== activeChannel.fallbackUrl) {
                currentLoadedUrl = activeChannel.fallbackUrl;
                hls.loadSource(activeChannel.fallbackUrl);
                hls.startLoad();
              } else {
                hls.destroy();
                setError('Live broadcast temporarily unavailable. Tap Retry to reconnect.');
                setIsLoading(false);
              }
              break;
          }
        }
      });
    }
    // 2. Native HLS support
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentLoadedUrl;
      video.addEventListener('loadedmetadata', () => {
        startAutoplay(video);
      }, { once: true });

      const handleError = () => {
        if (activeChannel.fallbackUrl && video.src !== activeChannel.fallbackUrl) {
          video.src = activeChannel.fallbackUrl;
          startAutoplay(video);
        } else {
          setError('Live broadcast temporarily unavailable. Tap Retry to reconnect.');
          setIsLoading(false);
        }
      };
      video.addEventListener('error', handleError, { once: true });
    } else {
      setError('Live streaming is not supported on this device.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, reloadKey, startAutoplay]);

  const handleRetryStream = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  // Channel Selection Handler
  const handleSelectChannel = useCallback((channel: LiveChannel) => {
    if (channel.id === activeChannel.id) return;
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    setActiveChannel(channel);
    setError(null);
    setIsLoading(true);
  }, [activeChannel.id]);

  // Play / Pause Toggle
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    triggerShowControls();
  }, [triggerShowControls]);

  // Mute Toggle
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
    if (!next) {
      setNeedsUnmute(false);
      video.volume = 1;
    }
  }, []);

  // Fullscreen / Landscape Toggle (Pure player landscape — keeps entire app safely in portrait)
  const exitFullscreenMode = useCallback(() => {
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    setIsFullscreen(false);
    setShowControls(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    setIsFullscreen((prev) => !prev);
    setShowControls(true);
  }, []);

  // Handle Hardware Back Button while in Fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleBack = () => {
      exitFullscreenMode();
      return true;
    };

    (window as any).handleAndroidBack = handleBack;
    return () => {
      if ((window as any).handleAndroidBack === handleBack) {
        delete (window as any).handleAndroidBack;
      }
    };
  }, [isFullscreen, exitFullscreenMode]);

  // Background Scroll Locking when in Fullscreen
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = origOverflow;
    }
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isFullscreen]);

  // Video Native Event Handlers
  const handleVideoWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleVideoPlaying = useCallback(() => {
    setIsLoading(false);
    setIsPlaying(true);
  }, []);

  const handleVideoPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleVideoStalled = useCallback(() => {
    // Stalled event handled naturally by Hls.js buffer
  }, []);

  // Render Category Icon Helper
  const renderCategoryIcon = (catId: ChannelCategory) => {
    switch (catId) {
      case 'all': return <Radio className="w-3.5 h-3.5" />;
      case 'hindi-news':
      case 'english-news': return <Tv className="w-3.5 h-3.5" />;
      case 'hindi-movies': return <Film className="w-3.5 h-3.5" />;
      case 'sports': return <Trophy className="w-3.5 h-3.5" />;
      case 'music': return <Music className="w-3.5 h-3.5" />;
      case 'hindi-entertainment': return <Sparkles className="w-3.5 h-3.5" />;
      case 'kids': return <Smile className="w-3.5 h-3.5" />;
      case 'documentary': return <Compass className="w-3.5 h-3.5" />;
      default: return <Globe className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#F5F5F2] pb-24 md:pb-12">
      {/* Top Header & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#292E35]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-headline text-[#F5F5F2]">
              Live TV
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-mono">
              24x7 Stream
            </span>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Aaj Tak, Star, Sports..."
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl bg-[#15181D] border border-[#292E35] text-xs sm:text-sm text-[#F5F5F2] placeholder-gray-500 focus:outline-none focus:border-[#F0B429] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Niche & Category Pills Selector */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {LIVE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#F0B429] text-[#0B0D10] border-[#F0B429] shadow-[0_2px_10px_rgba(240,180,41,0.3)]'
                    : 'bg-[#15181D] text-gray-300 hover:text-white hover:bg-[#1D2127] border-[#292E35]'
                }`}
              >
                {renderCategoryIcon(cat.id)}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout: Live Player + Channel Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <div className="flex flex-col gap-3">
          {/* Live Player Container (Supports Pure CSS Player Landscape) */}
          <div
            ref={playerContainerRef}
            onClick={triggerShowControls}
            style={
              isFullscreen
                ? isPortrait
                  ? {
                      position: 'fixed',
                      top: '50%',
                      left: '50%',
                      width: '100vh',
                      height: '100vw',
                      transform: 'translate(-50%, -50%) rotate(90deg)',
                      zIndex: 9999,
                    }
                  : {
                      position: 'fixed',
                      inset: 0,
                      width: '100vw',
                      height: '100vh',
                      zIndex: 9999,
                    }
                : undefined
            }
            className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#292E35] select-none ${
              isFullscreen ? 'rounded-none' : ''
            }`}
          >
            {/* HTML5 Video Tag — Default original fit (object-contain) */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              className="w-full h-full object-contain bg-black"
              onWaiting={handleVideoWaiting}
              onPlaying={handleVideoPlaying}
              onPause={handleVideoPause}
              onStalled={handleVideoStalled}
            />

            {/* Tap to Unmute Audio Banner */}
            {needsUnmute && !isLoading && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-[#F0B429] text-[#0B0D10] text-xs font-bold shadow-[0_4px_20px_rgba(240,180,41,0.4)] flex items-center gap-1.5 cursor-pointer animate-bounce select-none"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Tap to Unmute Audio</span>
              </div>
            )}

            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#F0B429] animate-spin" />
                <span className="text-xs font-mono font-bold text-gray-300">
                  Tuning into {activeChannel.name}...
                </span>
              </div>
            )}

            {/* Error Screen with Retry & Back to Channels */}
            {error && (
              <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Broadcast Temporarily Unavailable
                </h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  {error}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleRetryStream}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0B429] text-[#0B0D10] text-xs font-bold cursor-pointer active:scale-95 shadow-[0_4px_16px_rgba(240,180,41,0.35)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Broadcast</span>
                  </button>
                  {isFullscreen && (
                    <button
                      type="button"
                      onClick={exitFullscreenMode}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 cursor-pointer active:scale-95"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Channels</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Controls Overlay */}
            <div
              className={`absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4 bg-gradient-to-t from-black/90 via-transparent to-black/70 transition-opacity duration-200 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* Dedicated Back Button when in Landscape/Fullscreen */}
                  {isFullscreen && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        exitFullscreenMode();
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold text-xs border border-white/20 active:scale-95 transition-all cursor-pointer mr-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  )}

                  <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/10 p-1 flex items-center justify-center overflow-hidden">
                    <img
                      src={activeChannel.logo}
                      alt={activeChannel.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white leading-tight flex items-center gap-2">
                      <span>{activeChannel.name}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-600 text-white font-bold leading-none animate-pulse">
                        LIVE
                      </span>
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-gray-300 truncate max-w-[200px] sm:max-w-md">
                      {activeChannel.currentProgram}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                    {activeChannel.quality}
                  </span>
                </div>
              </div>

              {/* Bottom Controls Bar */}
              <div className="flex items-center justify-between">
                {/* Left: Play/Pause & Mute */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlayPause();
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F0B429] hover:bg-[#F7C948] text-[#0B0D10] flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-[0_4px_20px_rgba(240,180,41,0.4)]"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#F0B429]" />}
                  </button>
                </div>

                {/* Right: Fullscreen Toggle */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Landscape Mode'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Channel Info Strip */}
          <div className="bg-[#15181D] border border-[#292E35] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0B0D10] border border-[#292E35] p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={activeChannel.logo}
                  alt={activeChannel.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{activeChannel.name}</h3>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                    LIVE
                  </span>
                  {activeChannel.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F0B429]/15 text-[#F0B429] font-bold">
                      {activeChannel.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9A9FA8] mt-0.5 truncate max-w-xs sm:max-w-md">
                  {activeChannel.currentProgram}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
              <span>{activeChannel.language}</span>
            </div>
          </div>

          {/* Channel Guide Grid Section */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-200">
                Channel Guide ({filteredChannels.length})
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {filteredChannels.map((channel) => {
                const isActive = channel.id === activeChannel.id;
                return (
                  <div
                    key={channel.id}
                    onClick={() => handleSelectChannel(channel)}
                    className={`group relative flex flex-col justify-between p-3 rounded-xl transition-all cursor-pointer select-none border ${
                      isActive
                        ? 'bg-[#F0B429]/10 border-[#F0B429] shadow-[0_0_15px_rgba(240,180,41,0.25)]'
                        : 'bg-[#15181D] hover:bg-[#1D2127] border-[#292E35] hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-[#0B0D10] border border-[#292E35] p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-end">
                        {isActive ? (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#F0B429] text-[#0B0D10] font-black uppercase tracking-wider animate-pulse">
                            PLAYING
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-black/40 text-gray-400">
                            {channel.quality}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-xs font-bold truncate leading-tight transition-colors ${
                        isActive ? 'text-[#F0B429]' : 'text-gray-200 group-hover:text-white'
                      }`}>
                        {channel.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 truncate mt-1">
                        {channel.currentProgram}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LiveTvView.displayName = 'LiveTvView';
