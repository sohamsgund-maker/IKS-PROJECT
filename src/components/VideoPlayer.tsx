import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, Settings, Captions, Volume2 as AudioIcon,
  RefreshCw, Check, Loader2, Server, ShieldCheck
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
}

const isDirectVideo = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  if (
    lower.includes('autoembed.co') ||
    lower.includes('player.videasy.net') ||
    lower.includes('videasy.net') ||
    lower.includes('vidlink.pro') ||
    lower.includes('smashystream.com') ||
    lower.includes('vidking.net') ||
    lower.includes('peachify.top')
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
}) => {
  const streamTitle = movie.type === 'series'
    ? `${movie.title} - S${season} E${episode}`
    : movie.title;

  // Elements
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Auto-hide controls timer & flags
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAttemptedAutoLandscape = useRef<boolean>(false);
  const savedPlaybackPosition = useRef<number>(0);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);

  // Micro-interaction states
  const [seekFeedback, setSeekFeedback] = useState<{ direction: 'left' | 'right'; seconds: number } | null>(null);
  const [centerHudIcon, setCenterHudIcon] = useState<'play' | 'pause' | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosPercent, setHoverPosPercent] = useState<number>(0);

  // Accurate detection of Hindi content availability
  const isHindiAvail = useMemo(() => {
    return isHindiContentAvailable(movie);
  }, [movie]);

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
        if (origLang.includes('ja') || origLang.includes('japanese')) {
          map.set('ja', { id: 'ja', name: 'Japanese', language: 'Japanese', nativeName: '日本語 (Original)', flag: '🇯🇵', isDefault: true });
          map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: 'English Dub', flag: '🌐', isDefault: false });
        } else if (origLang.includes('ko') || origLang.includes('korean')) {
          map.set('ko', { id: 'ko', name: 'Korean', language: 'Korean', nativeName: '한국어 (Original)', flag: '🇰🇷', isDefault: true });
          map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: 'English Dub', flag: '🌐', isDefault: false });
        } else if (origLang.includes('es') || origLang.includes('spanish')) {
          map.set('es', { id: 'es', name: 'Spanish', language: 'Spanish', nativeName: 'Español (Original)', flag: '🇪🇸', isDefault: true });
          map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: 'English Dub', flag: '🌐', isDefault: false });
        } else if (origLang.includes('fr') || origLang.includes('french')) {
          map.set('fr', { id: 'fr', name: 'French', language: 'French', nativeName: 'Français (Original)', flag: '🇫🇷', isDefault: true });
          map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: 'English Dub', flag: '🌐', isDefault: false });
        } else {
          map.set('en', { id: 'en', name: 'English', language: 'English', nativeName: 'English (Original)', flag: '🌐', isDefault: true });
        }
      }
    }

    return Array.from(map.values());
  }, [dynamicAudioTracks, movie, isHindiAvail]);

  // 3. HINDI-FIRST ACCURATE SELECTION
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

  // 4. SERVER SELECTION: Clean, ad-free streaming defaulting to AutoEmbed 4K or Peachify for Hindi
  const [internalServer, setInternalServer] = useState<StreamServerId>(() => {
    if (propActiveServer) return propActiveServer;
    if (isDirectVideo(movie.videoUrl)) return 'direct';

    const isInitialHindi = selectedAudioTrack?.id === 'hi' ||
      selectedAudioTrack?.name?.toLowerCase() === 'hindi' ||
      initialAudioLanguage?.toLowerCase() === 'hindi';

    if (isHindiAvail && isInitialHindi) {
      return 'peachify';
    }

    return 'autoembed';
  });

  const activeServer = propActiveServer || internalServer;

  const setActiveServer = useCallback((s: StreamServerId) => {
    setInternalServer(s);
    if (onServerChange) onServerChange(s);
  }, [onServerChange]);

  // Audio & Volume state
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('cinevault_player_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(1);

  // UI menu state
  const [areControlsVisible, setAreControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeMenu, setActiveMenu] = useState<'none' | 'audio' | 'server' | 'quality' | 'speed' | 'subtitles'>('none');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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
    const color = 'E50914';
    const lang = selectedAudioTrack.name || 'Hindi';

    let base = '';
    switch (activeServer) {
      case 'peachify':
        base = isSeries
          ? `https://peachify.top/embed/tv/${tmdbId}/${season}/${episode}${lang.toLowerCase().includes('hindi') ? '?dub=Hindi' : ''}`
          : `https://peachify.top/embed/movie/${tmdbId}${lang.toLowerCase().includes('hindi') ? '?dub=Hindi' : ''}`;
        break;
      case 'autoembed':
        base = isSeries
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}?lang=${encodeURIComponent(lang)}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}?lang=${encodeURIComponent(lang)}`;
        break;
      case 'vidlink':
        base = isSeries
          ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=${color}&multiAudio=true&autoplay=true`
          : `https://vidlink.pro/movie/${tmdbId}?primaryColor=${color}&multiAudio=true&autoplay=true`;
        break;
      case 'videasy':
        base = isSeries
          ? `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}?color=${color}&nextEpisode=true&autoplayNextEpisode=true`
          : `https://player.videasy.net/movie/${tmdbId}?color=${color}`;
        break;
      case 'smashystream':
        base = isSeries
          ? `https://player.smashystream.com/tv/${tmdbId}?s=${season}&e=${episode}`
          : `https://player.smashystream.com/movie/${tmdbId}`;
        break;
      case 'vidking':
        base = isSeries
          ? `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=${color}&autoPlay=true`
          : `https://www.vidking.net/embed/movie/${tmdbId}?color=${color}&autoPlay=true`;
        break;
      default:
        base = fallbackEmbedUrl || (isSeries
          ? `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`
          : `https://autoembed.co/movie/tmdb/${tmdbId}`);
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
        setActiveServer('autoembed');
        showToast('⚡ Switched to AutoEmbed 4K Stream');
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
      setIsLoading(false);
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeServer, initDirectVideo]);

  // -------------------------------------------------------------
  // CONTROLS AUTO-HIDE LOGIC
  // -------------------------------------------------------------
  const resetControlsTimeout = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    if (isPlaying && activeMenu === 'none') {
      controlsTimeoutRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 3000);
    }
  }, [isPlaying, activeMenu]);

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
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(duration || video.duration || 0, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    savedPlaybackPosition.current = newTime;

    setSeekFeedback({
      direction: seconds > 0 ? 'right' : 'left',
      seconds: Math.abs(seconds),
    });
    setTimeout(() => setSeekFeedback(null), 600);
    resetControlsTimeout();
  }, [duration, resetControlsTimeout]);

  const adjustVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.max(0, Math.min(1, volume + delta));
    video.volume = newVol;
    video.muted = newVol === 0;
    setVolume(newVol);
    setIsMuted(newVol === 0);
    localStorage.setItem('cinevault_player_volume', String(newVol));
    showToast(`Volume: ${Math.round(newVol * 100)}%`);
    resetControlsTimeout();
  }, [volume, showToast, resetControlsTimeout]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 1;
      video.muted = false;
      video.volume = restored;
      setVolume(restored);
      setIsMuted(false);
      showToast('Unmuted');
    } else {
      setPrevVolume(volume);
      video.muted = true;
      video.volume = 0;
      setVolume(0);
      setIsMuted(true);
      showToast('Muted');
    }
    resetControlsTimeout();
  }, [isMuted, volume, prevVolume, showToast, resetControlsTimeout]);

  // -------------------------------------------------------------
  // FULLSCREEN CONTROLS
  // -------------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // -------------------------------------------------------------
  // KEYBOARD SHORTCUTS INTEGRATION
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.05);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, seekRelative, adjustVolume]);

  // -------------------------------------------------------------
  // DOUBLE-TAP / DOUBLE-CLICK SEEK
  // -------------------------------------------------------------
  const handlePlayerAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftSide = clickX < rect.width / 2;

    if (now - lastTapRef.current.time < 300) {
      // Double click/tap detected!
      seekRelative(isLeftSide ? -10 : 10);
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x: clickX };
      resetControlsTimeout();
    }
  };

  // -------------------------------------------------------------
  // AUDIO LANGUAGE SWITCHING (Preserves Position)
  // -------------------------------------------------------------
  const handleSelectAudioLanguage = (track: AudioTrack) => {
    if (videoRef.current) {
      savedPlaybackPosition.current = videoRef.current.currentTime;
    }

    setSelectedAudioTrack(track);
    setActiveMenu('none');
    showToast(`🔊 Audio: ${track.name} ${track.flag || ''}`);

    if (onAudioChange) {
      onAudioChange(track);
    }

    const isHindi = track.id === 'hi' || track.name.toLowerCase() === 'hindi';

    if (isHindi && !activeServerInfo.hasHindi) {
      handleSelectServer('peachify');
    } else if (!isHindi && activeServer === 'peachify') {
      handleSelectServer('autoembed');
    }

    if (activeServer === 'direct' && hlsRef.current && hlsRef.current.audioTracks.length > 0) {
      const idx = hlsRef.current.audioTracks.findIndex(
        (t) => t.lang?.toLowerCase() === track.id.toLowerCase() || t.name?.toLowerCase().includes(track.name.toLowerCase())
      );
      if (idx !== -1) hlsRef.current.audioTrack = idx;
    }
  };

  // -------------------------------------------------------------
  // SERVER SWITCHING
  // -------------------------------------------------------------
  const handleSelectServer = (serverId: StreamServerId) => {
    if (videoRef.current) {
      savedPlaybackPosition.current = videoRef.current.currentTime;
    }

    setActiveServer(serverId);
    setActiveMenu('none');
    setIsLoading(true);

    const s = STREAM_SERVERS.find((x) => x.id === serverId);
    showToast(`⚡ Switched to Server: ${s?.name || serverId}`);
  };

  const handleQuickNextServer = () => {
    const serversList: StreamServerId[] = [
      'autoembed',
      'peachify',
      'vidlink',
      'videasy',
      'direct',
      'smashystream',
      'vidking',
    ];
    const currentIndex = serversList.indexOf(activeServer);
    const nextIndex = (currentIndex + 1) % serversList.length;
    handleSelectServer(serversList[nextIndex]);
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

  // -------------------------------------------------------------
  // TIMELINE SCRUBBING & HOVER PREVIEW
  // -------------------------------------------------------------
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newPercent = clickX / rect.width;
    const newTime = newPercent * duration;

    video.currentTime = newTime;
    setCurrentTime(newTime);
    savedPlaybackPosition.current = newTime;
    resetControlsTimeout();
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = hoverX / rect.width;
    setHoverPosPercent(pct * 100);
    setHoverTime(pct * duration);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;

    const clamped = Math.max(0, Math.min(1, newVolume));
    video.volume = clamped;
    video.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
    localStorage.setItem('cinevault_player_volume', String(clamped));
  };

  const activeServerInfo = STREAM_SERVERS.find((s) => s.id === activeServer) || STREAM_SERVERS[0];

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={handlePlayerAreaClick}
      className={`player-landscape-container relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-800/80 select-none group font-sans ${
        !areControlsVisible && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* In-Player Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/90 border border-[#E50914] text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* DOUBLE-TAP / DOUBLE-CLICK SEEK RIPPLE FEEDBACK */}
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

      {/* PLAY / PAUSE CENTER HUD PULSE */}
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

      {/* TOP STREAM BAR OVERLAY */}
      <div className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
        areControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-white truncate font-display">
            {streamTitle}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 border border-zinc-700 text-[10px] text-zinc-300 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Verified 4K Stream</span>
          </span>
        </div>

        {/* Current Active Server & Audio Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'server' ? 'none' : 'server');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-bold cursor-pointer transition-colors"
            title="Switch Stream Server"
            aria-label="Switch Server Source"
          >
            <Server className="w-3 h-3 text-[#E50914]" />
            <span className="hidden md:inline">{activeServerInfo.name}</span>
            <span className="md:hidden">Server</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E50914]/20 hover:bg-[#E50914]/30 border border-[#E50914]/40 text-red-400 text-[11px] font-bold cursor-pointer transition-colors"
            title="Audio Language Selector"
            aria-label="Switch Audio Language"
          >
            <span>{selectedAudioTrack.flag} {selectedAudioTrack.name}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STREAM RENDERING ENGINE: (Fast CDN Embed OR Direct HTML5)       */}
      {/* ------------------------------------------------------------- */}
      {activeServer === 'direct' ? (
        <>
          {/* DIRECT HTML5 VIDEO PLAYER */}
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
              setActiveServer('autoembed');
              showToast('⚡ Auto-switched to AutoEmbed 4K Stream');
            }}
            className="w-full h-full object-contain cursor-pointer"
          />

          {/* HTML5 Central Play Overlay */}
          {!isPlaying && !isLoading && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 cursor-pointer"
            >
              <div className="p-4 sm:p-5 rounded-full bg-[#E50914] text-white shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" />
              </div>
            </div>
          )}

          {/* HTML5 Scrubbing Controls Bar */}
          <div
            className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-12 pb-3 px-3 sm:px-5 transition-opacity duration-300 ${
              areControlsVisible || !isPlaying ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Progress Bar with Hover Tooltip */}
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={() => setHoverTime(null)}
              className="relative w-full h-1.5 hover:h-2.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all mb-3 group/bar"
            >
              {/* Hover Tooltip Preview */}
              {hoverTime !== null && (
                <div
                  style={{ left: `${hoverPosPercent}%` }}
                  className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] font-mono font-bold text-white shadow pointer-events-none"
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              <div style={{ width: `${bufferedPercent}%` }} className="absolute inset-y-0 left-0 bg-white/40 rounded-full" />
              <div style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} className="absolute inset-y-0 left-0 bg-[#E50914] rounded-full relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform -mr-1.5" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause (Space / K)' : 'Play (Space / K)'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <div className="flex items-center gap-1 group/vol">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                    aria-label="Toggle Mute"
                  >
                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    aria-label="Volume Slider"
                    className="w-0 group-hover/vol:w-16 sm:group-hover/vol:w-20 transition-all duration-200 accent-[#E50914] h-1 cursor-pointer opacity-0 group-hover/vol:opacity-100"
                  />
                </div>
                <div className="text-[11px] sm:text-xs font-mono text-zinc-300">
                  <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => seekRelative(-10)}
                  className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title="Rewind 10s (Left Arrow)"
                  aria-label="Rewind 10 seconds"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => seekRelative(10)}
                  className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title="Forward 10s (Right Arrow)"
                  aria-label="Forward 10 seconds"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveMenu(activeMenu === 'subtitles' ? 'none' : 'subtitles')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeMenu === 'subtitles' ? 'bg-[#E50914] text-white' : 'hover:bg-white/15 text-white'
                  }`}
                  title="Subtitles"
                  aria-label="Closed Captions and Subtitles"
                >
                  <Captions className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveMenu(activeMenu === 'speed' ? 'none' : 'speed')}
                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                    activeMenu === 'speed' || activeMenu === 'quality' ? 'bg-[#E50914] text-white' : 'hover:bg-white/15 text-white'
                  }`}
                  title="Playback Speed & Settings"
                  aria-label="Playback Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title="Fullscreen (F)"
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* HIGH-SPEED VIP STREAMING EMBED (AutoEmbed 4K, VidLink, Videasy, Peachify) */}
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
            className="w-full h-full border-0 absolute inset-0 z-0 bg-black"
          />

          {/* FLOATING ACTION OVERLAY CONTROLS (Server Switcher, Audio, Fullscreen) */}
          <div
            className={`absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex items-center gap-1.5 sm:gap-2 transition-opacity duration-300 ${
              areControlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* QUICK SERVER SWITCHER */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickNextServer();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-zinc-200 hover:text-white text-xs font-bold border border-zinc-700/80 backdrop-blur-md transition-all active:scale-95 shadow-xl cursor-pointer"
              title="Click to Switch Stream Server if video buffers"
              aria-label="Switch Server Mirror"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{activeServerInfo.badge}</span>
              <span className="sm:hidden">Switch</span>
            </button>

            {/* AUDIO & DUB SELECTOR */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 shadow-xl cursor-pointer backdrop-blur-md ${
                activeMenu === 'audio'
                  ? 'bg-[#E50914] border-[#E50914] text-white shadow-red-900/40'
                  : 'bg-black/80 hover:bg-black border-zinc-700/80 text-zinc-200 hover:text-white'
              }`}
              title="Audio Languages (Hindi Priority)"
              aria-label="Audio Language Track"
            >
              <AudioIcon className="w-3.5 h-3.5" />
              <span>{selectedAudioTrack.flag} {selectedAudioTrack.name}</span>
            </button>

            {/* FULLSCREEN */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 rounded-lg bg-black/80 hover:bg-black text-zinc-200 hover:text-white border border-zinc-700/80 backdrop-blur-md transition-all active:scale-95 shadow-xl cursor-pointer"
              title="Fullscreen (F)"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------- */}
      {/* IN-PLAYER POPOVER MENUS (Audio, Servers, Subtitles, Speed)    */}
      {/* ------------------------------------------------------------- */}

      {/* 1. AUDIO & DUB SELECTOR MODAL */}
      {activeMenu === 'audio' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <AudioIcon className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Select Audio Track
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            {!isHindiAvail && (
              <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                <span className="text-sm">ℹ️</span>
                <span>Hindi dub is not available for this title. Playing in original audio ({movie.language || 'English'}).</span>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {allAudioTracks.map((t) => {
                const isSelected = selectedAudioTrack.id === t.id;
                const isHindi = t.id === 'hi' || t.name.toLowerCase() === 'hindi';
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectAudioLanguage(t)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
                      isSelected
                        ? 'bg-[#E50914]/20 border-[#E50914] text-white font-bold ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{t.flag || '🌐'}</span>
                      <span>{t.name}</span>
                      {isHindi && isHindiAvail && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          HINDI DUB (PRIORITY #1)
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
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left border ${
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

      {/* 3. PLAYBACK SPEED & QUALITY SETTINGS MODAL */}
      {activeMenu === 'speed' && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#E50914]" />
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Player Settings
                </h3>
              </div>
              <button
                onClick={() => setActiveMenu('none')}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Quality Section */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Quality</span>
              <div className="grid grid-cols-3 gap-1.5">
                {availableQualities.map((q) => {
                  const isSelected = currentQuality.quality === q.quality;
                  return (
                    <button
                      key={q.quality}
                      onClick={() => handleSelectQuality(q)}
                      className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center border ${
                        isSelected
                          ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg'
                          : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {q.quality}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback Speed Section */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Playback Speed</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => {
                  const isSelected = playbackSpeed === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleSelectSpeed(s)}
                      className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center border ${
                        isSelected
                          ? 'bg-[#E50914] border-[#E50914] text-white shadow-lg'
                          : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {s === 1 ? '1.0x (Normal)' : `${s}x`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBTITLES MODAL */}
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
                  Subtitles / Closed Captions
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
