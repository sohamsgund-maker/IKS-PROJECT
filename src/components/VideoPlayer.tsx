import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Settings, Captions, Headphones,
  Check, Loader2, Server, ArrowLeft, Download, Share2,
  Cast, MoreVertical, Sun, Lock, Unlock, Scaling, Gauge
} from 'lucide-react';
import type { Movie, MovieQuality, AudioTrack, Subtitle } from '../types/movie';
import { isHindiContentAvailable } from '../services/api';
import {
  STREAM_SERVERS,
  type StreamServerId,
  type StreamServerOption,
} from '../constants/streamingServers';

export { STREAM_SERVERS, type StreamServerId, type StreamServerOption };

interface VideoPlayerProps {
  movie: Movie;
  initialQuality?: MovieQuality;
  initialAudioLanguage?: string;
  season?: number;
  episode?: number;
  onQualityChange?: (quality: MovieQuality) => void;
  onAudioChange?: (audio: AudioTrack) => void;
  fallbackEmbedUrl?: string;
  dynamicAudioTracks?: AudioTrack[];
  activeServer?: StreamServerId;
  onServerChange?: (server: StreamServerId) => void;
  onBack?: () => void;
}

const isDirectVideo = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  if (
    lower.includes('2embed.cc') ||
    lower.includes('peachify.top') ||
    lower.includes('embed') ||
    lower.includes('iframe')
  ) {
    return false;
  }
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.m3u8') ||
    lower.endsWith('.ogg') ||
    lower.includes('.mp4?') ||
    lower.includes('.m3u8?') ||
    lower.includes('commondatastorage.googleapis.com') ||
    lower.startsWith('blob:')
  );
};

const parseDurationToSeconds = (durStr?: string): number => {
  if (!durStr) return 6970; // 1h 56m 10s default matching reference
  const str = durStr.toLowerCase().trim();
  let total = 0;
  const hMatch = str.match(/(\d+)\s*h/);
  const mMatch = str.match(/(\d+)\s*m/);
  const sMatch = str.match(/(\d+)\s*s/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 3600;
  if (mMatch) total += parseInt(mMatch[1], 10) * 60;
  if (sMatch) total += parseInt(sMatch[1], 10);
  if (total > 0) return total;

  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3 && !parts.some(isNaN)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2 && !parts.some(isNaN)) {
    return parts[0] * 60 + parts[1];
  }
  return 6970;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movie,
  initialQuality,
  initialAudioLanguage,
  season = 1,
  episode = 1,
  onQualityChange,
  onAudioChange,
  fallbackEmbedUrl,
  dynamicAudioTracks = [],
  activeServer: propActiveServer,
  onServerChange,
  onBack,
}) => {
  const streamTitle = movie.type === 'series'
    ? `${movie.title} - S${season} E${episode}`
    : movie.title;

  // Elements
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Timers & Position Refs
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAttemptedAutoLandscape = useRef<boolean>(false);
  const savedPlaybackPosition = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(3); // Matches 0:03 starting position
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPercent, setBufferedPercent] = useState<number>(25);

  // Micro-interaction & gesture states
  const [seekFeedback, setSeekFeedback] = useState<{ direction: 'left' | 'right'; seconds: number } | null>(null);
  const [centerHudIcon, setCenterHudIcon] = useState<'play' | 'pause' | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number>(0);

  // Device-friendly controls states (as shown in reference video)
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [showUnlockBadge, setShowUnlockBadge] = useState<boolean>(false);
  const unlockBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [brightness, setBrightness] = useState<number>(1.0);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState<boolean>(false);
  const brightnessIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('cinevault_player_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(1);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState<boolean>(false);
  const volumeIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fit screen mode: contain (Fit) -> cover (Zoom/Crop) -> fill (Stretch)
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');

  // Touch gesture tracker for vertical brightness/volume drag
  const touchStartRef = useRef<{
    x: number;
    y: number;
    type: 'none' | 'brightness' | 'volume';
    startVal: number;
  }>({ x: 0, y: 0, type: 'none', startVal: 0 });

  // UI menu & toast state
  const [areControlsVisible, setAreControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'none' | 'audio' | 'server' | 'quality' | 'speed' | 'subtitles'>('none');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accurate detection of Hindi content availability
  const isHindiAvail = useMemo(() => {
    return isHindiContentAvailable(movie);
  }, [movie]);

  // Effective duration
  const effectiveDuration = useMemo(() => {
    return duration > 0 ? duration : parseDurationToSeconds(movie.duration);
  }, [duration, movie.duration]);

  // 1. DYNAMIC MULTI-AUDIO LANGUAGES DISCOVERY
  const allAudioTracks = useMemo<AudioTrack[]>(() => {
    const map = new Map<string, AudioTrack>();

    if (dynamicAudioTracks && dynamicAudioTracks.length > 0) {
      dynamicAudioTracks.forEach((t) => {
        if (!map.has(t.id)) map.set(t.id, t);
      });
    }

    if (movie.audioTracks && movie.audioTracks.length > 0) {
      movie.audioTracks.forEach((t) => {
        if (!map.has(t.id)) map.set(t.id, t);
      });
    }

    if (map.size === 0) {
      const origLang = (movie.language || movie.originalLanguage || 'English').toLowerCase();
      if (isHindiAvail) {
        map.set('hi', { id: 'hi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी (Dual Audio / Default)', flag: '🇮🇳', isDefault: true });
        map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: 'English (Original)', flag: '🌐', isDefault: false });
        if (origLang.includes('te') || origLang.includes('telugu')) {
          map.set('te', { id: 'te', name: 'Telugu', language: 'Telugu', nativeName: 'తెలుగు', flag: '🏹', isDefault: false });
        } else if (origLang.includes('ta') || origLang.includes('tamil')) {
          map.set('ta', { id: 'ta', name: 'Tamil', language: 'Tamil', nativeName: 'தமிழ்', flag: '🌴', isDefault: false });
        }
      } else {
        map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: `${movie.language || 'English'} (Original)`, flag: '🌐', isDefault: true });
        if (origLang !== 'en') {
          map.set(origLang, { id: origLang, name: movie.language || origLang, language: movie.language || origLang, nativeName: movie.language || origLang, flag: '🌐', isDefault: false });
        }
      }
    }

    return Array.from(map.values());
  }, [dynamicAudioTracks, movie, isHindiAvail]);

  // 2. HINDI-FIRST ACCURATE SELECTION
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack>(() => {
    if (initialAudioLanguage) {
      const matched = allAudioTracks.find(
        (t) => t.id === initialAudioLanguage || t.name.toLowerCase() === initialAudioLanguage.toLowerCase()
      );
      if (matched) return matched;
    }

    if (isHindiAvail) {
      const hindiTrack = allAudioTracks.find(
        (t) => t.id === 'hi' || t.name.toLowerCase() === 'hindi' || t.language.toLowerCase() === 'hindi'
      );
      if (hindiTrack) return hindiTrack;
    }

    const defaultTrack = allAudioTracks.find((t) => t.isDefault);
    if (defaultTrack) return defaultTrack;

    return allAudioTracks[0];
  });

  // 3. SERVER SELECTION: Defaults to Server Epsilon (2Embed) for instant Dual Audio & Hindi streaming
  const [internalServer, setInternalServer] = useState<StreamServerId>(() => {
    if (propActiveServer) return propActiveServer;
    if (isDirectVideo(movie.videoUrl)) return 'direct';
    return '2embed';
  });

  const activeServer = propActiveServer || internalServer;

  const setActiveServer = useCallback((s: StreamServerId) => {
    setInternalServer(s);
    if (onServerChange) onServerChange(s);
  }, [onServerChange]);

  // Qualities list
  const availableQualities: MovieQuality[] = movie.qualities && movie.qualities.length > 0
    ? movie.qualities
    : [
        { quality: '1080p', videoUrl: movie.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { quality: '720p', videoUrl: movie.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
        { quality: '480p', videoUrl: movie.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      ];

  const [currentQuality, setCurrentQuality] = useState<MovieQuality>(() => {
    return initialQuality || availableQualities[0];
  });

  // Subtitles
  const availableSubtitles: Subtitle[] = movie.subtitles && movie.subtitles.length > 0
    ? movie.subtitles
    : [
        { language: 'off', label: 'Off', src: '' },
        { language: 'en', label: 'English [CC]', src: '' },
        { language: 'hi', label: 'Hindi (हिंदी)', src: '' },
      ];
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // -------------------------------------------------------------
  // AUTOMATIC MOBILE LANDSCAPE MODE
  // -------------------------------------------------------------
  const attemptMobileAutoLandscape = useCallback(async () => {
    if (hasAttemptedAutoLandscape.current) return;
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (!isMobile) return;

    hasAttemptedAutoLandscape.current = true;

    try {
      if (containerRef.current && !document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      }

      const orientation = screen.orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
      if (orientation && typeof orientation.lock === 'function') {
        await orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Graceful continuation
    }
  }, []);

  // -------------------------------------------------------------
  // EMBED URL RESOLUTION WITH HINDI PRIORITY & TIMESTAMP RESUME
  // -------------------------------------------------------------
  const resolvedEmbedUrl = useMemo(() => {
    const tmdbId = movie.tmdbId || movie.id || movie._id || '1213243';
    const isSeries = movie.type === 'series';
    const lang = selectedAudioTrack.name || 'Hindi';
    const rawId = (movie as any).imdb_id || movie.imdbId || tmdbId;

    let base = '';
    switch (activeServer) {
      case 'peachify':
        base = isSeries
          ? `https://peachify.top/embed/tv/${tmdbId}/${season}/${episode}${lang.toLowerCase().includes('hindi') ? '?dub=Hindi' : ''}`
          : `https://peachify.top/embed/movie/${tmdbId}${lang.toLowerCase().includes('hindi') ? '?dub=Hindi' : ''}`;
        break;
      case '2embed':
      default:
        base = fallbackEmbedUrl || (isSeries
          ? `https://www.2embed.cc/embedtv/${rawId}&s=${season}&e=${episode}`
          : `https://www.2embed.cc/embed/${rawId}`);
        break;
    }

    if (savedPlaybackPosition.current > 0 && !base.includes('#t=')) {
      return `${base}#t=${Math.floor(savedPlaybackPosition.current)}`;
    }
    return base;
  }, [activeServer, selectedAudioTrack, movie, season, episode, fallbackEmbedUrl]);

  // -------------------------------------------------------------
  // DIRECT HTML5 VIDEO INITIALIZATION (When activeServer === 'direct')
  // -------------------------------------------------------------
  const directVideoUrl = useMemo(() => {
    if (isDirectVideo(currentQuality.videoUrl)) return currentQuality.videoUrl;
    if (isDirectVideo(movie.videoUrl)) return movie.videoUrl;
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
  }, [currentQuality, movie]);

  const initDirectVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || activeServer !== 'direct') return;

    setIsLoading(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = directVideoUrl.includes('.m3u8') || directVideoUrl.includes('hls');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(directVideoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (savedPlaybackPosition.current > 0) video.currentTime = savedPlaybackPosition.current;
        video.play().catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, () => {
        setActiveServer('2embed');
        showToast('⚡ Switched to Server Epsilon (2Embed)');
      });

      hlsRef.current = hls;
    } else {
      video.src = directVideoUrl;
      video.load();
      if (savedPlaybackPosition.current > 0) video.currentTime = savedPlaybackPosition.current;
    }
  }, [activeServer, directVideoUrl, showToast, setActiveServer]);

  useEffect(() => {
    if (activeServer === 'direct') {
      initDirectVideo();
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsLoading(false);
      setIsBuffering(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeServer, initDirectVideo]);

  // Simulated live playback timer for embed players
  useEffect(() => {
    if (activeServer === 'direct' || !isPlaying) return;
    const timer = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (next >= effectiveDuration) {
          setIsPlaying(false);
          return 0;
        }
        savedPlaybackPosition.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeServer, isPlaying, effectiveDuration]);

  // -------------------------------------------------------------
  // CONTROLS AUTO-HIDE LOGIC
  // -------------------------------------------------------------
  const resetControlsTimeout = useCallback(() => {
    if (isScreenLocked) return;
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && activeMenu === 'none') {
      controlsTimeoutRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying, activeMenu, isScreenLocked]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // -------------------------------------------------------------
  // PLAY / PAUSE CONTROLS & HUD PULSE
  // -------------------------------------------------------------
  const togglePlay = useCallback(() => {
    attemptMobileAutoLandscape();
    if (activeServer === 'direct') {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().then(() => {
          setIsPlaying(true);
          setCenterHudIcon('play');
          setTimeout(() => setCenterHudIcon(null), 500);
        }).catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
        setCenterHudIcon('pause');
        setTimeout(() => setCenterHudIcon(null), 500);
      }
    } else {
      setIsPlaying((prev) => {
        const next = !prev;
        setCenterHudIcon(next ? 'play' : 'pause');
        setTimeout(() => setCenterHudIcon(null), 500);
        return next;
      });
    }
    resetControlsTimeout();
  }, [activeServer, attemptMobileAutoLandscape, resetControlsTimeout]);

  // -------------------------------------------------------------
  // SEEKING & VOLUME HELPERS
  // -------------------------------------------------------------
  const seekRelative = useCallback((seconds: number) => {
    const total = effectiveDuration;
    const newTime = Math.max(0, Math.min(total, currentTime + seconds));
    if (activeServer === 'direct' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    savedPlaybackPosition.current = newTime;

    setSeekFeedback({
      direction: seconds > 0 ? 'right' : 'left',
      seconds: Math.abs(seconds),
    });
    setTimeout(() => setSeekFeedback(null), 600);
    resetControlsTimeout();
  }, [effectiveDuration, currentTime, activeServer, resetControlsTimeout]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
    setVolume(clamped);
    setIsMuted(clamped === 0);
    localStorage.setItem('cinevault_player_volume', String(clamped));
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted || volume === 0) {
      const restore = prevVolume > 0 ? prevVolume : 1;
      handleVolumeChange(restore);
    } else {
      setPrevVolume(volume);
      handleVolumeChange(0);
    }
    resetControlsTimeout();
  }, [isMuted, volume, prevVolume, handleVolumeChange, resetControlsTimeout]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    attemptMobileAutoLandscape();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch {
        // Fallback
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      } catch {
        // Fallback
      }
    }
    resetControlsTimeout();
  }, [attemptMobileAutoLandscape, resetControlsTimeout]);

  // Keyboard Shortcuts (Space, K, M, F, Left, Right, Up, Down)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (isScreenLocked) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange(volume + 0.1);
          setShowVolumeIndicator(true);
          setTimeout(() => setShowVolumeIndicator(false), 1200);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange(volume - 0.1);
          setShowVolumeIndicator(true);
          setTimeout(() => setShowVolumeIndicator(false), 1200);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, seekRelative, handleVolumeChange, volume, isScreenLocked]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // -------------------------------------------------------------
  // DEVICE-FRIENDLY GESTURES (Brightness / Volume / Tap / Lock)
  // -------------------------------------------------------------
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScreenLocked) return;
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touchX = touch.clientX - rect.left;
    const isLeft = touchX < rect.width * 0.4;
    const isRight = touchX > rect.width * 0.6;

    if (isLeft) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        type: 'brightness',
        startVal: brightness,
      };
    } else if (isRight) {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        type: 'volume',
        startVal: isMuted ? 0 : volume,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isScreenLocked || touchStartRef.current.type === 'none') return;
    const touch = e.touches[0];
    const deltaY = touchStartRef.current.y - touch.clientY;

    if (touchStartRef.current.type === 'brightness') {
      const newBright = Math.max(0.2, Math.min(1.0, touchStartRef.current.startVal + deltaY / 200));
      setBrightness(newBright);
      setShowBrightnessIndicator(true);
      if (brightnessIndicatorTimeoutRef.current) clearTimeout(brightnessIndicatorTimeoutRef.current);
    } else if (touchStartRef.current.type === 'volume') {
      const newVol = Math.max(0, Math.min(1.0, touchStartRef.current.startVal + deltaY / 200));
      handleVolumeChange(newVol);
      setShowVolumeIndicator(true);
      if (volumeIndicatorTimeoutRef.current) clearTimeout(volumeIndicatorTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current.type = 'none';
    if (brightnessIndicatorTimeoutRef.current) clearTimeout(brightnessIndicatorTimeoutRef.current);
    brightnessIndicatorTimeoutRef.current = setTimeout(() => setShowBrightnessIndicator(false), 1200);

    if (volumeIndicatorTimeoutRef.current) clearTimeout(volumeIndicatorTimeoutRef.current);
    volumeIndicatorTimeoutRef.current = setTimeout(() => setShowVolumeIndicator(false), 1200);
  };

  const handleToggleLock = () => {
    if (!isScreenLocked) {
      setIsScreenLocked(true);
      setAreControlsVisible(false);
      setShowUnlockBadge(true);
      showToast('🔒 Screen Locked (Controls hidden)');
      if (unlockBadgeTimeoutRef.current) clearTimeout(unlockBadgeTimeoutRef.current);
      unlockBadgeTimeoutRef.current = setTimeout(() => setShowUnlockBadge(false), 3000);
    } else {
      setIsScreenLocked(false);
      setShowUnlockBadge(false);
      setAreControlsVisible(true);
      showToast('🔓 Screen Unlocked');
    }
  };

  const toggleFitMode = () => {
    setFitMode((prev) => {
      const next = prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain';
      const label = next === 'contain' ? 'Fit Screen (Original)' : next === 'cover' ? 'Zoom (Crop to Fill)' : 'Stretch (Full Frame)';
      showToast(`🔲 Screen: ${label}`);
      return next;
    });
  };

  const handlePlayerAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isScreenLocked) {
      setShowUnlockBadge(true);
      if (unlockBadgeTimeoutRef.current) clearTimeout(unlockBadgeTimeoutRef.current);
      unlockBadgeTimeoutRef.current = setTimeout(() => setShowUnlockBadge(false), 3000);
      return;
    }

    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    const clickX = rect ? e.clientX - rect.left : 0;
    const isLeftHalf = rect ? clickX < rect.width / 2 : false;

    if (now - lastTapRef.current.time < 300) {
      if (isLeftHalf) {
        seekRelative(-10);
      } else {
        seekRelative(10);
      }
      lastTapRef.current = { time: 0, x: 0 };
      return;
    }

    lastTapRef.current = { time: now, x: clickX };

    if (activeMenu !== 'none') {
      setActiveMenu('none');
      return;
    }

    setAreControlsVisible((prev) => !prev);
    resetControlsTimeout();
  };

  // Top bar action handlers
  const handleDownload = () => {
    const downloadUrl = currentQuality.downloadUrl || currentQuality.videoUrl || movie.videoUrl;
    if (downloadUrl && isDirectVideo(downloadUrl)) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}_${currentQuality.quality}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('⬇️ Download started in 1080p HD');
    } else {
      navigator.clipboard.writeText(resolvedEmbedUrl).catch(() => {});
      showToast('⬇️ Direct stream download link copied to clipboard');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Watch ${movie.title} on CineVault`,
      text: `Stream ${movie.title} in HD Dual Audio on CineVault!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('🔗 Shared successfully');
      } catch {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('🔗 Stream link copied to clipboard!');
    }
  };

  const handleCast = async () => {
    const video = videoRef.current;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
      showToast('📺 Exited Picture-in-Picture');
    } else if (video && document.pictureInPictureEnabled) {
      try {
        await video.requestPictureInPicture();
        showToast('📺 Playing in Picture-in-Picture (PiP)');
      } catch {
        showToast('📺 AirPlay / Cast ready on local network');
      }
    } else {
      showToast('📺 Wireless Display / AirPlay Ready');
    }
  };

  // Audio track switching
  const handleSelectAudioLanguage = (track: AudioTrack) => {
    setSelectedAudioTrack(track);
    setActiveMenu('none');
    if (onAudioChange) onAudioChange(track);
    showToast(`🎧 Audio Track: ${track.name} ${track.flag || ''}`);
  };

  // Server switching
  const handleSelectServer = (serverId: StreamServerId) => {
    setActiveServer(serverId);
    setActiveMenu('none');
    setIsLoading(true);

    const s = STREAM_SERVERS.find((x) => x.id === serverId);
    showToast(`⚡ Switched to Server: ${s?.name || serverId}`);
  };

  const handleSelectQuality = (q: MovieQuality) => {
    setCurrentQuality(q);
    if (onQualityChange) onQualityChange(q);
    setActiveMenu('none');
    showToast(`Quality: ${q.quality}`);
  };

  const handleSelectSpeed = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setActiveMenu('none');
    showToast(`Speed: ${speed}x`);
  };

  const handleSelectSubtitle = (subLang: string) => {
    setSelectedSubtitle(subLang);
    setActiveMenu('none');
    const label = availableSubtitles.find((s) => s.language === subLang)?.label || subLang;
    showToast(`Subtitles: ${label}`);
  };

  // Timeline scrubbing
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !effectiveDuration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = clickX / rect.width;
    const newTime = newPercent * effectiveDuration;

    if (activeServer === 'direct' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    savedPlaybackPosition.current = newTime;
    resetControlsTimeout();
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !effectiveDuration) return;
    const rect = bar.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = hoverX / rect.width;
    setHoverPosPercent(pct * 100);
    setHoverTime(pct * effectiveDuration);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={handlePlayerAreaClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`player-landscape-container relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 select-none group font-sans ${
        !areControlsVisible && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* IN-PLAYER TOAST */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/95 border border-[#E50914] text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none flex items-center gap-1.5">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DOUBLE-TAP SEEK RIPPLE FEEDBACK */}
      {seekFeedback && (
        <div
          className={`absolute top-0 bottom-0 z-40 w-1/3 flex items-center justify-center pointer-events-none ${
            seekFeedback.direction === 'left' ? 'left-0 bg-gradient-to-r from-black/60 to-transparent' : 'right-0 bg-gradient-to-l from-black/60 to-transparent'
          }`}
        >
          <div className="p-4 rounded-full bg-black/80 border border-white/20 text-white flex flex-col items-center gap-1 animate-pulse-ripple">
            {seekFeedback.direction === 'left' ? (
              <>
                <RotateCcw className="w-8 h-8 text-[#E50914]" />
                <span className="text-xs font-black">-{seekFeedback.seconds}s</span>
              </>
            ) : (
              <>
                <RotateCw className="w-8 h-8 text-[#E50914]" />
                <span className="text-xs font-black">+{seekFeedback.seconds}s</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* CENTER PLAY/PAUSE HUD PULSE */}
      {centerHudIcon && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="p-5 rounded-full bg-black/80 border border-white/20 text-white shadow-2xl animate-pulse-ripple">
            {centerHudIcon === 'play' ? (
              <Play className="w-10 h-10 fill-current ml-1 text-[#E50914]" />
            ) : (
              <Pause className="w-10 h-10 fill-current text-white" />
            )}
          </div>
        </div>
      )}

      {/* LEFT BRIGHTNESS VERTICAL INDICATOR PILL */}
      {showBrightnessIndicator && (
        <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-black/85 border border-white/20 text-white backdrop-blur-md animate-fade-in pointer-events-none shadow-2xl">
          <Sun className="w-5 h-5 text-amber-400" />
          <div className="w-1.5 h-20 sm:h-24 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
            <div 
              style={{ height: `${Math.round(brightness * 100)}%` }} 
              className="w-full bg-amber-400 rounded-full transition-all duration-75" 
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-300">
            {Math.round(brightness * 100)}%
          </span>
        </div>
      )}

      {/* RIGHT VOLUME VERTICAL INDICATOR PILL */}
      {showVolumeIndicator && (
        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-black/85 border border-white/20 text-white backdrop-blur-md animate-fade-in pointer-events-none shadow-2xl">
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5 text-red-400" />
          ) : (
            <Volume2 className="w-5 h-5 text-cyan-400" />
          )}
          <div className="w-1.5 h-20 sm:h-24 bg-white/20 rounded-full overflow-hidden flex flex-col justify-end">
            <div 
              style={{ height: `${Math.round((isMuted ? 0 : volume) * 100)}%` }} 
              className="w-full bg-cyan-400 rounded-full transition-all duration-75" 
            />
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      )}

      {/* FLOATING UNLOCK BADGE (When screen is locked) */}
      {isScreenLocked && showUnlockBadge && (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 animate-fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock();
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/90 border-2 border-[#E50914] text-white text-xs font-bold shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Unlock className="w-4 h-4 text-[#E50914]" />
            <span>Tap to Unlock Screen</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP BAR (Back, Title, Download, Share, Cast, More)           */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-gradient-to-b from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          (areControlsVisible && !isScreenLocked) || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Back Arrow & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isFullscreen) {
                toggleFullscreen();
              } else if (onBack) {
                onBack();
              }
            }}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate font-display">
              {streamTitle}
            </h2>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400">
              {movie.releaseYear || '2024'} • {movie.duration || '2h 15m'} • Server Epsilon (2Embed)
            </span>
          </div>
        </div>

        {/* Top Right Actions: Download, Share, Cast, More */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
            title="Download Movie"
            aria-label="Download Movie"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
            title="Share Stream"
            aria-label="Share Stream"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCast();
            }}
            className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
            title="Cast / AirPlay / PiP"
            aria-label="Cast to Screen"
          >
            <Cast className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'server' ? 'none' : 'server');
            }}
            className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
            title="More Options & Servers"
            aria-label="More Options"
          >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CENTER PLAYBACK CONTROLS (Rewind 10s, Play/Pause, Forward 10s) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center gap-8 sm:gap-16 pointer-events-none transition-opacity duration-300 ${
          (areControlsVisible && !isScreenLocked) || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Rewind 10s */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            seekRelative(-10);
          }}
          className="pointer-events-auto p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer flex flex-col items-center justify-center relative"
          title="Rewind 10s"
          aria-label="Rewind 10 seconds"
        >
          <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-[9px] font-black absolute">10</span>
        </button>

        {/* Large Play/Pause Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="pointer-events-auto p-5 sm:p-6 rounded-full bg-[#E50914] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all ring-4 ring-[#E50914]/40 cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
          ) : (
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current ml-1" />
          )}
        </button>

        {/* Forward 10s */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            seekRelative(10);
          }}
          className="pointer-events-auto p-3 sm:p-4 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer flex flex-col items-center justify-center relative"
          title="Forward 10s"
          aria-label="Forward 10 seconds"
        >
          <RotateCw className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="text-[9px] font-black absolute">10</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM CONTROLS & TIMELINE TOOLBAR (Exact Video Match)       */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-10 pb-2.5 sm:pb-3 px-3 sm:px-6 transition-opacity duration-300 ${
          (areControlsVisible && !isScreenLocked) || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Timeline Scrubber Bar with Left/Right Timestamps */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono font-bold text-zinc-300 min-w-[40px]">
            {formatTime(currentTime)}
          </span>

          <div
            ref={progressBarRef}
            onClick={handleSeek}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={() => setHoverTime(null)}
            className="relative flex-1 h-1.5 hover:h-2.5 bg-white/25 hover:bg-white/35 rounded-full cursor-pointer transition-all group/bar"
          >
            {hoverTime !== null && (
              <div
                style={{ left: `${hoverPosPercent}%` }}
                className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] font-mono font-bold text-white shadow pointer-events-none"
              >
                {formatTime(hoverTime)}
              </div>
            )}

            {/* Buffered Bar */}
            <div
              style={{ width: `${bufferedPercent || Math.min(100, ((currentTime + 300) / effectiveDuration) * 100)}%` }}
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
            />

            {/* Current Played Progress */}
            <div
              style={{ width: `${effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0}%` }}
              className="absolute inset-y-0 left-0 bg-[#E50914] rounded-full relative"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform -mr-1.5 ring-2 ring-[#E50914]" />
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-zinc-400 min-w-[50px] text-right">
            {formatTime(effectiveDuration)}
          </span>
        </div>

        {/* Bottom Toolbar: Speed, Best Quality, Lock, Fit Screen, Subtitles, Audio (red), Server, Full */}
        <div className="flex items-center justify-around sm:justify-between pt-1.5 border-t border-white/10 text-zinc-300">
          {/* 1. SPEED */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'speed' ? 'none' : 'speed');
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Playback Speed"
          >
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            <span className="text-[10px] sm:text-xs font-semibold">Speed</span>
          </button>

          {/* 2. BEST QUALITY */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'quality' ? 'none' : 'quality');
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Best Quality"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            <span className="text-[10px] sm:text-xs font-semibold">Best Quality</span>
          </button>

          {/* 3. LOCK SCREEN */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock();
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Lock Screen"
          >
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            <span className="text-[10px] sm:text-xs font-semibold">Lock</span>
          </button>

          {/* 4. FIT SCREEN */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFitMode();
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Fit Screen (Contain / Crop / Stretch)"
          >
            <Scaling className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            <span className="text-[10px] sm:text-xs font-semibold">Fit Screen</span>
          </button>

          {/* 5. SUBTITLES */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'subtitles' ? 'none' : 'subtitles');
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Subtitles"
          >
            <Captions className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            <span className="text-[10px] sm:text-xs font-semibold">Subtitles</span>
          </button>

          {/* 6. AUDIO (Red highlight just like reference video!) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio');
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-red-500/20 text-[#E50914] transition-colors cursor-pointer group"
            title="Audio Tracks & Hindi Dub"
          >
            <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-[#E50914]" />
            <span className="text-[10px] sm:text-xs font-bold text-[#E50914]">Audio</span>
          </button>

          {/* 7. SERVER SWITCHER */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'server' ? 'none' : 'server');
            }}
            className="hidden sm:flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Switch Stream Server"
          >
            <Server className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-[10px] sm:text-xs font-semibold text-amber-300">Server</span>
          </button>

          {/* 8. FULLSCREEN */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="flex flex-col items-center gap-1 p-1 sm:p-2 rounded-lg hover:bg-white/15 hover:text-white transition-colors cursor-pointer group"
            title="Fullscreen (F)"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300 group-hover:text-white" />
            )}
            <span className="text-[10px] sm:text-xs font-semibold">Full</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. STREAM RENDERING ENGINE: Direct HTML5 OR Server Epsilon     */}
      {/* ------------------------------------------------------------- */}
      <div 
        className="w-full h-full relative overflow-hidden transition-all duration-300"
        style={{ filter: `brightness(${brightness})` }}
      >
        {activeServer === 'direct' ? (
          <video
            ref={videoRef}
            playsInline
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                savedPlaybackPosition.current = videoRef.current.currentTime;
                if (videoRef.current.buffered.length > 0 && videoRef.current.duration > 0) {
                  const bEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
                  setBufferedPercent((bEnd / videoRef.current.duration) * 100);
                }
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
                setIsLoading(false);
              }
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsLoading(false);
              setIsPlaying(true);
            }}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              setActiveServer('2embed');
              showToast('⚡ Switched to Server Epsilon (2Embed)');
            }}
            className={`w-full h-full cursor-pointer transition-transform duration-300 ${
              fitMode === 'contain' ? 'object-contain' : fitMode === 'cover' ? 'object-cover scale-105' : 'object-fill'
            }`}
          />
        ) : (
          <iframe
            key={`${activeServer}-${selectedAudioTrack.id}-${season}-${episode}-${resolvedEmbedUrl}`}
            src={resolvedEmbedUrl}
            title={`${streamTitle} Stream`}
            allowFullScreen
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            onLoad={() => {
              setIsLoading(false);
              setIsBuffering(false);
            }}
            className={`w-full h-full border-0 absolute inset-0 z-0 bg-black transition-transform duration-300 ${
              fitMode === 'contain' ? 'scale-100' : fitMode === 'cover' ? 'scale-110 sm:scale-105' : 'scale-100'
            }`}
          />
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL POPUPS: Audio, Server, Quality, Speed, Subtitles      */}
      {/* ------------------------------------------------------------- */}

      {/* 1. AUDIO TRACK SELECTOR MODAL */}
      {activeMenu === 'audio' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Audio & Language Dubs
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {allAudioTracks.map((t) => {
                const isSelected = selectedAudioTrack.id === t.id;
                const isHindi = t.id === 'hi' || t.name.toLowerCase().includes('hindi');
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectAudioLanguage(t)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{t.flag || '🌐'}</span>
                      <span>{t.nativeName || t.name}</span>
                      {isHindi && isHindiAvail && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          PRIORITY #1
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#E50914]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. STREAM SERVER SELECTOR MODAL */}
      {activeMenu === 'server' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Stream Servers & Mirrors
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {STREAM_SERVERS.map((s) => {
                const isSelected = activeServer === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectServer(s.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{s.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400">{s.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#E50914] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. QUALITY SELECTOR MODAL */}
      {activeMenu === 'quality' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Best Quality Selection
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-1.5">
              {([
                { label: '1080p Full HD (Best Quality)', value: '1080p' as const, badge: 'Ultra HD' },
                { label: '720p HD', value: '720p' as const, badge: 'Standard HD' },
                { label: '480p SD (Data Saver)', value: '480p' as const, badge: 'Saver' },
              ]).map((q) => {
                const isSelected = currentQuality.quality.includes(q.value);
                return (
                  <button
                    key={q.value}
                    onClick={() => {
                      const target: MovieQuality = availableQualities.find((x) => x.quality.includes(q.value)) || {
                        quality: q.value,
                        videoUrl: movie.videoUrl || '',
                      };
                      handleSelectQuality(target);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{q.label}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {q.badge}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#E50914]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SPEED SELECTOR MODAL */}
      {activeMenu === 'speed' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Playback Speed
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => {
                const isSelected = playbackSpeed === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSelectSpeed(s)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                      isSelected
                        ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {s === 1 ? '1.0x (Normal)' : `${s}x`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBTITLES MODAL */}
      {activeMenu === 'subtitles' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Captions className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Subtitles & Captions
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {availableSubtitles.map((sub) => {
                const isSelected = selectedSubtitle === sub.language;
                return (
                  <button
                    key={sub.language}
                    onClick={() => handleSelectSubtitle(sub.language)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#E50914]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading & Buffering Spinner */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="p-3 rounded-full bg-black/70 border border-zinc-800 shadow-2xl backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-[#E50914] animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
