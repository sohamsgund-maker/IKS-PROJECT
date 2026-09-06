import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ArrowLeft, Film, ShieldCheck, Sparkles, Check, Server, Crown
} from 'lucide-react';
import type { Movie, MovieQuality, AudioTrack, StreamInfoResponse } from '../types/movie';
import { api, getEmbedUrl, isHindiContentAvailable } from '../services/api';
import { VideoPlayer, type StreamServerId, STREAM_SERVERS } from '../components/VideoPlayer';

interface WatchPageProps {
  movie: Movie;
  selectedQuality: MovieQuality;
  onBack: () => void;
  onQualityChange: (quality: MovieQuality) => void;
}

export const WatchPage: React.FC<WatchPageProps> = ({
  movie,
  selectedQuality,
  onBack,
  onQualityChange,
}) => {
  const [currentSeason, setCurrentSeason] = useState<number>(1);
  const [currentEpisode, setCurrentEpisode] = useState<number>(1);
  const [activeServer, setActiveServer] = useState<StreamServerId>(() => {
    const origLang = (movie.originalLanguage || movie.language || 'English').toLowerCase();
    const isDubbedHindi = isHindiContentAvailable(movie) && !origLang.includes('hi') && !origLang.includes('hindi');
    return isDubbedHindi ? 'peachify' : 'vidlink';
  });
  const [streamInfo, setStreamInfo] = useState<StreamInfoResponse | null>(null);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<AudioTrack | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const episodeSectionRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Check if Hindi is genuinely available for this content
  const isHindiAvail = useMemo(() => {
    if (streamInfo?.isHindiAvailable !== undefined) {
      return streamInfo.isHindiAvailable;
    }
    return isHindiContentAvailable(movie);
  }, [streamInfo, movie]);

  // Fetch Stream Info from Backend API Scraper & Processing Layer
  useEffect(() => {
    let isCancelled = false;
    const fetchStreams = async () => {
      const id = movie.tmdbId || movie.id || movie._id;
      if (!id) return;

      try {
        const info = await api.getStreamInfo(id, currentSeason, currentEpisode, movie);
        if (!isCancelled && info) {
          setStreamInfo(info);
          if (info.audioTracks && info.audioTracks.length > 0) {
            // Find default track (Hindi-first if Hindi available, else original)
            const defaultTrack = info.audioTracks.find((t) => t.isDefault) || info.audioTracks[0];
            setSelectedAudioTrack(defaultTrack);
          }
        }
      } catch (err) {
        console.warn('Backend stream info fetch fallback:', err);
      }
    };

    fetchStreams();
    return () => {
      isCancelled = true;
    };
  }, [movie, currentSeason, currentEpisode]);

  // Fallback Embed Provider URL
  const fallbackEmbedUrl = useMemo(() => {
    if (streamInfo?.fallbackEmbedUrl) return streamInfo.fallbackEmbedUrl;
    const defaultLang = isHindiAvail ? 'Hindi' : (movie.language || 'English');
    return getEmbedUrl(activeServer, movie, currentSeason, currentEpisode, selectedAudioTrack?.name || defaultLang);
  }, [streamInfo, movie, currentSeason, currentEpisode, selectedAudioTrack, isHindiAvail, activeServer]);

  // Detected Dynamic Audio Tracks
  const audioTracksList = useMemo(() => {
    if (streamInfo?.audioTracks && streamInfo.audioTracks.length > 0) {
      return streamInfo.audioTracks;
    }
    const origLang = (movie.language || movie.originalLanguage || 'English').toLowerCase();
    if (isHindiAvail) {
      const tracks: AudioTrack[] = [
        { id: 'hi', name: 'Hindi', language: 'Hindi', nativeName: 'हिन्दी (Dubbed/Original)', flag: '🇮🇳', isDefault: true },
        { id: 'en', name: 'English', language: 'English', nativeName: 'English (Original)', flag: '🌐', isDefault: false },
      ];
      if (origLang.includes('te') || origLang.includes('telugu')) {
        tracks.push({ id: 'te', name: 'Telugu', language: 'Telugu', nativeName: 'తెలుగు', flag: '🏹', isDefault: false });
      } else if (origLang.includes('ta') || origLang.includes('tamil')) {
        tracks.push({ id: 'ta', name: 'Tamil', language: 'Tamil', nativeName: 'தமிழ்', flag: '🌴', isDefault: false });
      }
      return tracks;
    }
    return [
      { id: 'en', name: 'English', language: 'English', nativeName: `${movie.language || 'English'} (Original)`, flag: '🌐', isDefault: true },
    ];
  }, [streamInfo, isHindiAvail, movie]);

  const activeAudioName = selectedAudioTrack?.name || (isHindiAvail ? 'Hindi' : (movie.language || 'English'));
  const activeAudioFlag = selectedAudioTrack?.flag || (isHindiAvail ? '🇮🇳' : '🌐');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-16 sm:pt-20 pb-24 px-3 sm:px-6 lg:px-12 max-w-[1720px] mx-auto select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#141414] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <Sparkles className="w-4 h-4 text-[#E50914]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP BAR: Back to Browse, Quality & Active Audio Status */}
      <div className="flex items-center justify-between pb-3 sm:pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161616] hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md group"
          title="Back to Catalog"
        >
          <ArrowLeft className="w-4 h-4 text-[#E50914] group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold">
          {/* VIP MOD 100% Ad-Free Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border border-amber-500/40 text-amber-300 text-[11px] font-bold shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>VIP MOD • 100% Ad-Free</span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>4K Ultra HD</span>
          </span>

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/40 text-red-400 text-[11px] font-bold">
            <span>{activeAudioFlag} Audio: {activeAudioName}</span>
            {isHindiAvail && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRIORITY #1
              </span>
            )}
          </span>
        </div>
      </div>

      {/* 2. PROFESSIONAL MODERN STREAMING VIDEO PLAYER */}
      <VideoPlayer
        key={`${movie.id || movie.tmdbId}-s${currentSeason}-e${currentEpisode}`}
        movie={movie}
        initialQuality={selectedQuality}
        initialAudioLanguage={activeAudioName}
        season={currentSeason}
        episode={currentEpisode}
        activeServer={activeServer}
        onServerChange={setActiveServer}
        onQualityChange={onQualityChange}
        onAudioChange={(track) => {
          setSelectedAudioTrack(track);
          const isHindi = track.id === 'hi' || track.name.toLowerCase().includes('hindi');
          const origLang = (movie.originalLanguage || movie.language || 'English').toLowerCase();
          const isDubbed = isHindi && !origLang.includes('hi') && !origLang.includes('hindi');
          if (isDubbed && activeServer !== 'peachify') {
            setActiveServer('peachify');
          } else if (!isHindi && activeServer === 'peachify') {
            setActiveServer('vidlink');
          }
          showToast(`Active Audio: ${track.name} ${track.flag || ''}`);
        }}
        fallbackEmbedUrl={fallbackEmbedUrl}
        dynamicAudioTracks={audioTracksList}
        onBack={onBack}
      />

      {/* QUICK VIP SERVER SWITCHER PILLS (Instant 1-Tap Switching) */}
      <div className="mt-3.5 space-y-1.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none scrollbar-none">
          <span className="text-xs font-bold text-zinc-400 shrink-0 flex items-center gap-1.5 pr-1">
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span>VIP Server:</span>
          </span>
          {STREAM_SERVERS.map((server) => {
            const isSelected = activeServer === server.id;
            return (
              <button
                key={server.id}
                onClick={() => {
                  setActiveServer(server.id);
                  showToast(`⚡ Switched to ${server.name}`);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-400 font-extrabold shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
              >
                <span>{server.badge || server.name}</span>
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </button>
            );
          })}
        </div>

        {/* VIP Shield Active Notice */}
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium px-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>VIP Shield Active • Popups blocked natively • Unthrottled 4K stream</span>
        </div>
      </div>

      {/* 3. METADATA SECTION */}
      <div className="mt-6 sm:mt-8 space-y-6">
        {/* Title & Badges */}
        <div className="space-y-2.5 pb-5 border-b border-zinc-800/80">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight">
            {movie.title}
          </h1>

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

            {isHindiAvail ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Hindi Dub & Multi-Audio Verified</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Original Audio Stream Verified</span>
              </span>
            )}
          </div>
        </div>

        {/* Synopsis & Key Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-xs sm:text-sm">
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Synopsis
            </h3>
            <p className="text-zinc-300 leading-relaxed text-sm sm:text-base font-normal">
              {movie.description || 'Experience high-definition streaming with instant single-tap playback, Hindi-first audio tracks, and professional controls.'}
            </p>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm text-zinc-400 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-800">
            <div>
              <span className="text-zinc-500 font-medium">Director: </span>
              <span className="text-zinc-200 font-semibold">{movie.director || 'Acclaimed Director'}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-medium">Starring: </span>
              <span className="text-zinc-200">{movie.cast?.join(', ') || 'Star Ensemble Cast'}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-medium">Genres: </span>
              <span className="text-zinc-200">{movie.genres?.join(', ') || 'Action, Drama'}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-medium">Available Audio: </span>
              {isHindiAvail ? (
                <>
                  <span className="text-amber-400 font-bold">Hindi (Default)</span>, English, Telugu, Tamil, Malayalam
                </>
              ) : (
                <>
                  <span className="text-zinc-200 font-bold">{movie.language || 'English'} (Original)</span>
                  <span className="text-zinc-500 ml-1">(Hindi dub unavailable)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 4. EPISODES GRID (For TV Series & Shows) */}
        {movie.type === 'series' && (
          <div ref={episodeSectionRef} className="space-y-4 pt-6 border-t border-zinc-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E50914]" />
                <h3 className="text-lg sm:text-xl font-bold text-white font-display">
                  Episodes & Seasons
                </h3>
              </div>

              <select
                value={currentSeason}
                onChange={(e) => {
                  setCurrentSeason(Number(e.target.value));
                  setCurrentEpisode(1);
                }}
                className="bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3.5 py-1.5 text-xs font-bold focus:outline-none cursor-pointer hover:border-zinc-500 transition-colors"
              >
                <option value={1}>Season 1</option>
                <option value={2}>Season 2</option>
                <option value={3}>Season 3</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((ep) => {
                const isPlayingEp = currentEpisode === ep;
                return (
                  <div
                    key={ep}
                    onClick={() => {
                      setCurrentEpisode(ep);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col rounded-xl overflow-hidden transition-all cursor-pointer border relative group ${
                      isPlayingEp
                        ? 'bg-[#E50914]/15 border-[#E50914] shadow-lg shadow-red-950/30 ring-1 ring-[#E50914]'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="aspect-video w-full bg-black relative overflow-hidden">
                      <img
                        src={movie.backdropUrl || movie.posterUrl}
                        alt={`Episode ${ep}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 z-10">
                        {isPlayingEp ? (
                          <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow">
                            <span>Playing</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold border border-white/20">
                            Ep {ep}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate ${isPlayingEp ? 'text-[#E50914]' : 'text-white'}`}>
                          Episode {ep}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-400">45m</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {movie.title} — Episode {ep}
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
