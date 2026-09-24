import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  SkipForward,
  SkipBack,
  RotateCcw,
  Loader2,
  AlertCircle,
  Sun,
  SunMedium,
  SunDim,
  Volume1,
  Scan,
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

export const LiveTvView: React.FC<LiveTvViewProps> = () => {
  const allChannels: LiveChannel[] = useMemo(() => liveTvService.getChannels(), []);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<LiveChannel>(allChannels[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [needsUnmute, setNeedsUnmute] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRetryStream = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  // Brightness, Fit Mode & Gesture Navigation State
  const [brightness, setBrightness] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cinevault_livetv_brightness');
      return saved ? Math.max(0.1, Math.min(1.0, parseFloat(saved))) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'fill'>(() => {
    try {
      return (localStorage.getItem('cinevault_livetv_fit') as any) || 'contain';
    } catch {
      return 'contain';
    }
  });
  const [activeGesture, setActiveGesture] = useState<'brightness' | 'volume' | null>(null);
  const [gestureValue, setGestureValue] = useState<number>(100);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{
    startX: number;
    startY: number;
    side: 'left' | 'right' | 'center';
    initialVal: number;
    hasMoved: boolean;
  } | null>(null);

  // Restore Portrait Orientation Helper
  const restorePortrait = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && (window as any).AndroidDevice?.setOrientation) {
        (window as any).AndroidDevice.setOrientation('portrait');
        (window as any).AndroidDevice.setFullscreen(false);
      }
      if (typeof screen !== 'undefined' && (screen.orientation as any)?.unlock) {
        (screen.orientation as any).unlock();
      }
      if (typeof screen !== 'undefined' && (screen.orientation as any)?.lock) {
        (screen.orientation as any).lock('portrait').catch(() => {});
      }
    } catch {}
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

  // Load & Stream the Active Channel (Automatic Playback on Change & on Retry)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeChannel) return;

    setIsLoading(true);
    setError(null);
    setShowControls(true);

    let currentLoadedUrl = activeChannel.streamUrl;
    let retryAttempts = 0;
    const maxRetries = 2;

    // Destroy existing Hls instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // 1. Try HLS.js when supported (standard desktop & android browsers)
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
      });
      hlsRef.current = hls;

      hls.loadSource(currentLoadedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        startAutoplay(video);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryAttempts < maxRetries) {
                retryAttempts++;
                hls.startLoad();
              } else if (activeChannel.fallbackUrl && currentLoadedUrl !== activeChannel.fallbackUrl) {
                currentLoadedUrl = activeChannel.fallbackUrl;
                retryAttempts = 0;
                hls.loadSource(activeChannel.fallbackUrl);
                hls.startLoad();
              } else {
                hls.destroy();
                setError('Live stream connection failed. Tap Retry or switch channels.');
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Live broadcast temporarily unavailable. Tap Retry or switch channels.');
              setIsLoading(false);
              break;
          }
        }
      });
    }
    // 2. Native HLS support (Safari iOS & native Android WebView)
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
          setError('Live broadcast temporarily unavailable. Tap Retry or switch channels.');
          setIsLoading(false);
        }
      };
      video.addEventListener('error', handleError, { once: true });
    } else {
      setError('Live streaming is not supported on this browser.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeChannel, reloadKey, startAutoplay]);

  // Channel Selection Handler (Instant Channel Switching)
  const handleSelectChannel = useCallback((channel: LiveChannel) => {
    if (channel.id === activeChannel.id) return;
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    setActiveChannel(channel);
  }, [activeChannel.id]);

  // Next / Previous Channel Navigation
  const handleNextChannel = useCallback(() => {
    const currentIndex = allChannels.findIndex((c) => c.id === activeChannel.id);
    const nextIndex = (currentIndex + 1) % allChannels.length;
    handleSelectChannel(allChannels[nextIndex]);
  }, [allChannels, activeChannel.id, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    const currentIndex = allChannels.findIndex((c) => c.id === activeChannel.id);
    const prevIndex = (currentIndex - 1 + allChannels.length) % allChannels.length;
    handleSelectChannel(allChannels[prevIndex]);
  }, [allChannels, activeChannel.id, handleSelectChannel]);

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

  // Mute Toggle & Unmute Action
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    setIsMuted(next);
    if (!next) {
      setNeedsUnmute(false);
      if (volume === 0) {
        setVolume(1);
        video.volume = 1;
      }
    }
  }, [volume]);

  // Exit Fullscreen & Return to Portrait
  const exitFullscreenMode = useCallback(() => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    restorePortrait();
  }, [restorePortrait]);

  // Enter Fullscreen
  const enterFullscreenMode = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {});
    }
    setIsFullscreen(true);

    try {
      if ((window as any).AndroidDevice?.setOrientation) {
        (window as any).AndroidDevice.setOrientation('landscape');
        (window as any).AndroidDevice.setFullscreen(true);
      }
      (window.screen?.orientation as any)?.lock?.('landscape').catch(() => {});
    } catch {}
  }, []);

  // Fullscreen Handler Toggle
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen || document.fullscreenElement) {
      exitFullscreenMode();
    } else {
      enterFullscreenMode();
    }
  }, [isFullscreen, exitFullscreenMode, enterFullscreenMode]);

  // Sync fullscreen state from document events & clean up
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        restorePortrait();
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      restorePortrait();
    };
  }, [restorePortrait]);

  // Handle Hardware Back Button while in Fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleBack = () => {
      exitFullscreenMode();
      return true;
    };

    const prevHandler = (window as any).handleAndroidBack;
    (window as any).handleAndroidBack = handleBack;

    return () => {
      if ((window as any).handleAndroidBack === handleBack) {
        (window as any).handleAndroidBack = prevHandler;
      }
    };
  }, [isFullscreen, exitFullscreenMode]);

  // Toast message helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2200);
  }, []);

  // Screen Aspect Ratio Fit Cycler (Fit -> Zoom -> Stretch)
  const cycleFitMode = useCallback(() => {
    queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
    setFitMode((prev) => {
      let next: 'contain' | 'cover' | 'fill' = 'contain';
      let label = '';
      if (prev === 'contain') {
        next = 'cover';
        label = 'Screen Fit: Zoom / Fill (No Black Bars)';
      } else if (prev === 'cover') {
        next = 'fill';
        label = 'Screen Fit: Stretch (Full Screen)';
      } else {
        next = 'contain';
        label = 'Screen Fit: Original (Fit)';
      }
      try {
        localStorage.setItem('cinevault_livetv_fit', next);
      } catch {}
      showToast(label);
      return next;
    });
  }, [showToast]);

  // Touch Gesture Handlers for Brightness (Left half) and Volume (Right half) in Fullscreen Landscape
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isFullscreen || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = playerContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = touch.clientX - rect.left;

    let side: 'left' | 'right' | 'center' = 'center';
    let initialVal = 1;
    if (x < rect.width * 0.45) {
      side = 'left';
      initialVal = brightness;
    } else if (x > rect.width * 0.55) {
      side = 'right';
      const v = videoRef.current ? videoRef.current.volume : volume;
      initialVal = isMuted ? 0 : v;
    }

    touchStartPosRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      side,
      initialVal,
      hasMoved: false,
    };
  }, [isFullscreen, brightness, volume, isMuted]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPosRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const { startX, startY, side, initialVal } = touchStartPosRef.current;
    if (side === 'center') return;

    const deltaY = startY - touch.clientY;
    const deltaX = Math.abs(touch.clientX - startX);

    if (!touchStartPosRef.current.hasMoved) {
      if (Math.abs(deltaY) < 8) return;
      if (deltaX > Math.abs(deltaY)) {
        touchStartPosRef.current.side = 'center';
        return;
      }
      touchStartPosRef.current.hasMoved = true;
    }

    const sensitivity = window.innerHeight * 0.65;
    const change = deltaY / sensitivity;

    if (gestureTimeoutRef.current) {
      clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = null;
    }

    if (side === 'left') {
      const nextBrightness = Math.max(0.1, Math.min(1.0, initialVal + change));
      setBrightness(nextBrightness);
      try {
        localStorage.setItem('cinevault_livetv_brightness', nextBrightness.toFixed(2));
      } catch {}
      setActiveGesture('brightness');
      setGestureValue(Math.round(nextBrightness * 100));
    } else if (side === 'right') {
      const nextVol = Math.max(0, Math.min(1.0, initialVal + change));
      if (videoRef.current) {
        videoRef.current.volume = nextVol;
        if (nextVol > 0 && videoRef.current.muted) {
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      }
      setVolume(nextVol);
      if (nextVol === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
      setActiveGesture('volume');
      setGestureValue(Math.round(nextVol * 100));
    }
  }, [isMuted]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartPosRef.current?.hasMoved) {
      if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
      gestureTimeoutRef.current = setTimeout(() => {
        setActiveGesture(null);
      }, 1000);
    }
    setTimeout(() => {
      touchStartPosRef.current = null;
    }, 50);
  }, []);

  // Category Icon Resolver
  const renderCategoryIcon = (catId: ChannelCategory) => {
    switch (catId) {
      case 'hindi-news':
      case 'english-news':
        return <Radio className="w-3.5 h-3.5" />;
      case 'hindi-movies':
        return <Film className="w-3.5 h-3.5" />;
      case 'hindi-entertainment':
        return <Tv className="w-3.5 h-3.5" />;
      case 'sports':
        return <Trophy className="w-3.5 h-3.5" />;
      case 'music':
        return <Music className="w-3.5 h-3.5" />;
      case 'kids':
        return <Smile className="w-3.5 h-3.5" />;
      case 'documentary':
        return <Compass className="w-3.5 h-3.5" />;
      case 'marathi':
      case 'tamil':
      case 'telugu':
      case 'malayalam':
      case 'kannada':
      case 'bengali':
      case 'gujarati':
      case 'punjabi':
      case 'odia':
      case 'assamese':
      case 'bhojpuri':
        return <Globe className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
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
              placeholder="Search Aaj Tak, Goldmines, Sports..."
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
            const count = cat.id === 'all' ? allChannels.length : allChannels.filter(c => c.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  queueMicrotask(() => { if (navigator.vibrate) navigator.vibrate(8); });
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer press-feedback border ${
                  isSelected
                    ? 'bg-[#F0B429] text-[#0B0D10] border-[#F0B429] shadow-[0_2px_10px_rgba(240,180,41,0.3)]'
                    : 'bg-[#15181D] text-gray-300 hover:text-white hover:bg-[#1D2127] border-[#292E35]'
                }`}
              >
                {renderCategoryIcon(cat.id)}
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-[#0B0D10]/20 text-[#0B0D10] font-black' : 'bg-[#292E35] text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Layout: Live Player + Channel Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        {/* Sticky Live Player Container */}
        <div className="flex flex-col gap-3">
          <div
            ref={playerContainerRef}
            onMouseMove={triggerShowControls}
            onClick={triggerShowControls}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#292E35] select-none ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : ''
            }`}
          >
            {/* HTML5 Video Tag */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              className={`w-full h-full transition-[object-fit] duration-200 bg-black ${
                fitMode === 'cover'
                  ? 'object-cover'
                  : fitMode === 'fill'
                  ? 'object-fill'
                  : 'object-contain'
              }`}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => {
                setIsLoading(false);
                setIsPlaying(true);
              }}
            />

            {/* Toast Notification */}
            {toastMessage && (
              <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-[#F0B429] text-[#0B0D10] font-bold text-xs shadow-[0_4px_20px_rgba(240,180,41,0.4)] pointer-events-none animate-fade-in">
                {toastMessage}
              </div>
            )}

            {/* Software Brightness Scrim */}
            <div
              className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-100"
              style={{
                backgroundColor: '#000000',
                opacity: Math.max(0, 1 - brightness),
              }}
            />

            {/* Left Edge: Brightness Gesture HUD */}
            {activeGesture === 'brightness' && (
              <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center bg-[#15181D]/90 backdrop-blur-xl border border-white/20 px-3 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-none animate-fade-in min-w-[56px]">
                <div className="text-[#F0B429] mb-3">
                  {gestureValue > 60 ? (
                    <Sun className="w-6 h-6" />
                  ) : gestureValue > 30 ? (
                    <SunMedium className="w-6 h-6" />
                  ) : (
                    <SunDim className="w-6 h-6" />
                  )}
                </div>
                <div className="relative w-2 h-28 sm:h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-[#F0B429] to-[#FFF0B3] rounded-full transition-all duration-75"
                    style={{ height: `${gestureValue}%` }}
                  />
                </div>
                <span className="mt-3 text-[11px] font-mono font-bold text-white tracking-wider">
                  {gestureValue}%
                </span>
              </div>
            )}

            {/* Right Edge: Volume Gesture HUD */}
            {activeGesture === 'volume' && (
              <div className="absolute right-6 sm:right-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center bg-[#15181D]/90 backdrop-blur-xl border border-white/20 px-3 py-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-none animate-fade-in min-w-[56px]">
                <div className="text-[#F0B429] mb-3">
                  {gestureValue === 0 || isMuted ? (
                    <VolumeX className="w-6 h-6 text-red-400" />
                  ) : gestureValue < 50 ? (
                    <Volume1 className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </div>
                <div className="relative w-2 h-28 sm:h-36 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-[#F0B429] to-[#FFF0B3] rounded-full transition-all duration-75"
                    style={{ height: `${gestureValue}%` }}
                  />
                </div>
                <span className="mt-3 text-[11px] font-mono font-bold text-white tracking-wider">
                  {gestureValue}%
                </span>
              </div>
            )}

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

            {/* Error Screen with Retry & Switch Channel */}
            {error && (
              <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
                <AlertCircle className="w-9 h-9 sm:w-11 sm:h-11 text-red-400" />
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
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0B429] text-[#0B0D10] text-xs font-bold cursor-pointer press-feedback shadow-[0_4px_16px_rgba(240,180,41,0.35)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Broadcast</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextChannel}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D2127] border border-[#292E35] text-white hover:text-[#F0B429] text-xs font-bold cursor-pointer press-feedback transition-colors"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Next Channel</span>
                  </button>
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
              <div
                className="flex items-center justify-between"
                style={{
                  paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
                  paddingRight: 'max(8px, env(safe-area-inset-right, 8px))',
                }}
              >
                <div className="flex items-center gap-2">
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
              <div
                className="flex items-center justify-between"
                style={{
                  paddingLeft: 'max(8px, env(safe-area-inset-left, 8px))',
                  paddingRight: 'max(8px, env(safe-area-inset-right, 8px))',
                }}
              >
                {/* Left: Play/Pause, Channel Surfers & Volume */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevChannel();
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="Previous Channel"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

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
                      handleNextChannel();
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="Next Channel"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
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

                  {/* Landscape On-Screen Brightness & Volume Sliders */}
                  {isFullscreen && (
                    <>
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md ml-1">
                        <Sun className="w-3.5 h-3.5 text-[#F0B429]" />
                        <input
                          type="range"
                          min={0.1}
                          max={1.0}
                          step={0.02}
                          value={brightness}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setBrightness(val);
                            try {
                              localStorage.setItem('cinevault_livetv_brightness', val.toFixed(2));
                            } catch {}
                            setActiveGesture('brightness');
                            setGestureValue(Math.round(val * 100));
                            if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
                            gestureTimeoutRef.current = setTimeout(() => setActiveGesture(null), 1000);
                          }}
                          className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#F0B429]"
                          title="Screen Brightness"
                        />
                        <span className="font-mono text-[10px] text-gray-300 w-7 text-right">{Math.round(brightness * 100)}%</span>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md">
                        <Volume2 className="w-3.5 h-3.5 text-[#F0B429]" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.02}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (videoRef.current) {
                              videoRef.current.volume = val;
                              if (val > 0 && videoRef.current.muted) {
                                videoRef.current.muted = false;
                                setIsMuted(false);
                              }
                            }
                            setVolume(val);
                            if (val === 0) setIsMuted(true);
                            else if (isMuted) setIsMuted(false);
                            setActiveGesture('volume');
                            setGestureValue(Math.round(val * 100));
                            if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
                            gestureTimeoutRef.current = setTimeout(() => setActiveGesture(null), 1000);
                          }}
                          className="w-16 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#F0B429]"
                          title="Audio Volume"
                        />
                        <span className="font-mono text-[10px] text-gray-300 w-7 text-right">{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: Screen Fit & Fullscreen */}
                <div className="flex items-center gap-2">
                  {/* Screen Fit Toggle - Landscape/Fullscreen Only */}
                  {isFullscreen && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleFitMode();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all"
                      title={`Screen Fit: ${fitMode === 'contain' ? 'Fit (Original)' : fitMode === 'cover' ? 'Zoom (Fill Screen)' : 'Stretch'}`}
                      aria-label="Toggle Screen Fit"
                    >
                      <Scan className="w-3.5 h-3.5 text-[#F0B429]" />
                      <span className="font-mono text-[10px] uppercase hidden sm:inline">
                        {fitMode === 'contain' ? 'Fit' : fitMode === 'cover' ? 'Zoom' : 'Stretch'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
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

          {/* Channel Grid Section */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-200">
                Channel Guide ({filteredChannels.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                Tap any channel to tune in
              </span>
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
};
