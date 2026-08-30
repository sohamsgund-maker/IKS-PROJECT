import React, { useState, useEffect, useMemo } from 'react';
import type { Movie, MovieQuality, AuthUser } from './types/movie';
import { api } from './services/api';
import { NetflixNavbar } from './components/NetflixNavbar';
import { NetflixBillboard } from './components/NetflixBillboard';
import { NetflixRow } from './components/NetflixRow';
import { NetflixInfoModal } from './components/NetflixInfoModal';
import { NetflixFooter } from './components/NetflixFooter';
import { NetflixMobileNav } from './components/NetflixMobileNav';
import { SettingsModal } from './components/SettingsModal';
import { CustomStreamModal } from './components/CustomStreamModal';
import { WatchPage } from './pages/WatchPage';
import { LiveTVPage } from './pages/LiveTVPage';
import { CheckCircle2, Bookmark, Play, Check, Search, Info, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Navigation / View State
  const [selectedMovieForInfo, setSelectedMovieForInfo] = useState<Movie | null>(null);
  const [watchMovie, setWatchMovie] = useState<{ movie: Movie; quality: MovieQuality } | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Watchlist (My List) state
  const [watchlist, setWatchlist] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem('cinevault_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const watchlistIds = useMemo(() => {
    const set = new Set<string | number>();
    watchlist.forEach((m) => {
      if (m.id) set.add(m.id);
      if (m.tmdbId) set.add(m.tmdbId);
    });
    return set;
  }, [watchlist]);

  // Watch History state
  const [history, setHistory] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem('cinevault_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCustomStreamOpen, setIsCustomStreamOpen] = useState(false);
  const [currentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('cinevault_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const fetchAllMovies = async () => {
    const data = await api.getMovies();
    setMovies(data);
  };

  useEffect(() => {
    fetchAllMovies();

    // Auto-sync scraper
    const timer = setTimeout(() => {
      api.syncAllScraper().then(res => {
        if (res?.data && res.data.length > 0) setMovies(res.data);
      }).catch(() => {});
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleWatchlist = (movie: Movie) => {
    setWatchlist((prev) => {
      const exists = prev.some((m) => m.id === movie.id || m.tmdbId === movie.tmdbId);
      const updated = exists
        ? prev.filter((m) => m.id !== movie.id && m.tmdbId !== movie.tmdbId)
        : [...prev, movie];
      try {
        localStorage.setItem('cinevault_watchlist', JSON.stringify(updated));
      } catch (e) {}
      showToast(exists ? `Removed "${movie.title}" from My List` : `Added "${movie.title}" to My List!`);
      return updated;
    });
  };

  const handlePlayMovie = (movie: Movie, quality?: MovieQuality) => {
    const defaultQuality = quality || movie.qualities?.[0] || { quality: '1080p', videoUrl: movie.videoUrl };
    setWatchMovie({ movie, quality: defaultQuality });
    setSelectedMovieForInfo(null);

    // Save to History
    setHistory((prev) => {
      const filtered = prev.filter((m) => m.id !== movie.id && m.tmdbId !== movie.tmdbId);
      const updated = [movie, ...filtered].slice(0, 20);
      try {
        localStorage.setItem('cinevault_history', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Primary Billboard Hero Movie
  const heroMovie = useMemo(() => {
    return (
      movies.find((m) => m.title.includes('Toxic') || m.title.includes('Spider-Man')) ||
      movies[0]
    );
  }, [movies]);

  // Categorized Rows
  const top10Trending = useMemo(() => {
    return movies.filter((m) => m.trending || m.featured).slice(0, 10);
  }, [movies]);

  const bollywoodMovies = useMemo(() => {
    return movies.filter((m) => 
      m.genres?.includes('Bollywood') || 
      m.language?.toLowerCase().includes('hindi')
    );
  }, [movies]);

  const southIndianMovies = useMemo(() => {
    return movies.filter(
      (m) =>
        m.genres?.includes('South Indian') ||
        m.language?.toLowerCase().includes('telugu') ||
        m.language?.toLowerCase().includes('tamil') ||
        m.language?.toLowerCase().includes('kannada') ||
        m.language?.toLowerCase().includes('malayalam') ||
        m.language?.toLowerCase().includes('south')
    );
  }, [movies]);

  const hollywoodMovies = useMemo(() => {
    return movies.filter(
      (m) =>
        m.genres?.includes('Hollywood') ||
        (!m.genres?.includes('Bollywood') &&
          !m.genres?.includes('South Indian') &&
          !m.genres?.includes('Anime') &&
          !m.genres?.includes('K-Drama') &&
          m.type === 'movie')
    );
  }, [movies]);

  const kdramaList = useMemo(() => {
    return movies.filter(
      (m) =>
        m.genres?.includes('K-Drama') ||
        m.language?.toLowerCase().includes('korean') ||
        m.title.toLowerCase().includes('squid game') ||
        m.title.toLowerCase().includes('queen of tears') ||
        m.title.toLowerCase().includes('vincenzo') ||
        m.title.toLowerCase().includes('glory') ||
        m.title.toLowerCase().includes('sweet home') ||
        m.title.toLowerCase().includes('all of us are dead')
    );
  }, [movies]);

  const animeList = useMemo(() => {
    return movies.filter(
      (m) => 
        m.genres?.includes('Anime') || 
        m.language?.toLowerCase().includes('japanese')
    );
  }, [movies]);

  const webSeries = useMemo(() => {
    return movies.filter(
      (m) => m.type === 'series' && !m.genres?.includes('Anime')
    );
  }, [movies]);

  // Instant & Debounced Search Results
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // 1. Instant 0ms Local Matching (No latency)
    const localMatches = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genres?.some((g) => g.toLowerCase().includes(q)) ||
        m.language?.toLowerCase().includes(q)
    );
    setSearchResults(localMatches);
    setIsSearching(true);

    // 2. Debounced 150ms background global search across TMDB & MovieBox
    const debounceTimer = setTimeout(async () => {
      try {
        const onlineResults = await api.search(q);
        if (onlineResults && onlineResults.length > 0) {
          const map = new Map<string | number, Movie>();
          [...localMatches, ...onlineResults].forEach((m) => {
            const key = m.tmdbId || m.id || m._id || m.title;
            if (key && !map.has(key)) map.set(key, m);
          });
          setSearchResults(Array.from(map.values()));
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, movies]);

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-[#E50914] selection:text-white antialiased relative pb-16 lg:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded bg-[#181818] border border-[#E50914] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#E50914]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Netflix Top Navigation Bar */}
      <NetflixNavbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setWatchMovie(null);
          setSelectedMovieForInfo(null);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        watchlistCount={watchlist.length}
      />

      {/* Main Streaming View */}
      {watchMovie ? (
        /* Dedicated Netflix Player Page */
        <div className="pt-16 sm:pt-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <WatchPage
            movie={watchMovie.movie}
            selectedQuality={watchMovie.quality}
            onBack={() => setWatchMovie(null)}
            onQualityChange={(q) => setWatchMovie({ movie: watchMovie.movie, quality: q })}
          />
        </div>
      ) : activeTab === 'live' ? (
        /* Live TV Broadcasts */
        <div className="pt-24 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto">
          <LiveTVPage />
        </div>
      ) : searchQuery.trim().length > 0 ? (
        /* Netflix Global Search Results Grid */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-zinc-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-300">
                Explore titles related to: <span className="text-white font-extrabold font-display">"{searchQuery}"</span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isSearching
                  ? 'Searching entire catalog & global servers...'
                  : `Found ${searchResults.length} matching titles`}
              </p>
            </div>

            <button
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700"
            >
              Clear Search
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {searchResults.map((m) => (
                <div
                  key={m.id || m.tmdbId}
                  onClick={() => setSelectedMovieForInfo(m)}
                  className="bg-[#202020] rounded-md overflow-hidden netflix-card-hover cursor-pointer shadow-md group relative"
                >
                  <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                    <img
                      src={m.posterUrl || m.backdropUrl}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 img-smooth"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (m.backdropUrl && target.src !== m.backdropUrl) {
                          target.src = m.backdropUrl;
                        }
                      }}
                    />

                    {/* Top Quality Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                      <span className="px-1.5 py-0.2 rounded bg-black/80 backdrop-blur-sm text-[8px] sm:text-[9px] font-black text-white border border-white/20">
                        4K UHD
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayMovie(m);
                        }}
                        className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg cursor-pointer"
                        title="Play"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMovieForInfo(m);
                        }}
                        className="p-3 rounded-full bg-black/60 border border-white/70 text-white hover:scale-110 transition-transform cursor-pointer"
                        title="More Info"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 space-y-1 bg-[#181818]">
                    <h4 className="text-xs font-bold text-white truncate font-display">{m.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                      <span className="text-[#46d369] font-bold">
                        {m.rating ? `${(m.rating * 10).toFixed(0)}% Match` : '98% Match'}
                      </span>
                      <span>{m.releaseYear || '2024'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isSearching ? (
            /* Pulsating Search Loading State */
            <div className="py-20 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-zinc-700 border-t-[#E50914] rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-zinc-300">
                Searching global database and servers for "{searchQuery}"...
              </p>
            </div>
          ) : (
            /* User Requested: "Sorry for inconvenience" Friendly Empty State */
            <div className="space-y-10 py-6">
              <div className="py-12 px-6 max-w-xl mx-auto text-center space-y-5 bg-[#181818]/70 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-[#E50914] shadow-inner">
                  <Search className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
                    Sorry for the Inconvenience!
                  </h2>
                  <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                    We couldn't find any movie, anime, or series matching "<span className="text-[#E50914] font-bold">{searchQuery}</span>" across the entire catalog or global servers.
                  </p>
                </div>

                <div className="bg-[#121212] border border-zinc-800/90 rounded-xl p-4 text-xs text-zinc-400 text-left space-y-2 max-w-md mx-auto">
                  <p className="font-bold text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Helpful Suggestions:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400">
                    <li>Check your spelling or try different keywords</li>
                    <li>Try searching with a shorter title (e.g. "KGF", "Pushpa", "Spider")</li>
                    <li>Search by main actor, director, or original language title</li>
                    <li>Browse our categorized tabs above (South Indian, Bollywood, Hollywood, Anime, K-Dramas)</li>
                  </ul>
                </div>

                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm transition-all cursor-pointer shadow-lg active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Explore Trending Titles</span>
                  <span>›</span>
                </button>
              </div>

              {/* Recommended Top Blockbusters so user is never stuck */}
              <div className="pt-2">
                <NetflixRow
                  title="🔥 Trending Blockbusters You Might Like"
                  movies={top10Trending}
                  onSelectMovie={setSelectedMovieForInfo}
                  onPlayMovie={handlePlayMovie}
                  onToggleWatchlist={handleToggleWatchlist}
                  watchlistIds={watchlistIds}
                />
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'watchlist' ? (
        /* My List View */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display flex items-center gap-2">
            <Bookmark className="w-7 h-7 text-[#E50914]" />
            <span>My List ({watchlist.length})</span>
          </h1>

          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {watchlist.map((m) => (
                <div
                  key={m.id || m.tmdbId}
                  onClick={() => setSelectedMovieForInfo(m)}
                  className="bg-[#202020] rounded overflow-hidden netflix-card-hover cursor-pointer shadow-md group"
                >
                  <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                    <img
                      src={m.posterUrl}
                      alt={m.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayMovie(m);
                        }}
                        className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleWatchlist(m);
                        }}
                        className="p-3 rounded-full bg-black/60 border border-white text-white hover:scale-110 transition-transform cursor-pointer"
                        title="Remove from My List"
                      >
                        <Check className="w-4 h-4 text-[#E50914]" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#181818]">
                    <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                    <span className="text-[10px] text-zinc-400">{m.releaseYear} • {m.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-[#181818] rounded-xl border border-zinc-800 space-y-3">
              <Bookmark className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">Your List is Empty</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Explore movies and series, and click the "+" icon to add titles to your personal list.
              </p>
            </div>
          )}
        </div>
      ) : activeTab === 'south' ? (
        /* South Indian View with Dedicated Hero Banner */
        <div className="space-y-4">
          <NetflixBillboard
            movies={southIndianMovies.slice(0, 6)}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
          />
          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            <NetflixRow title="🔥 Trending South Indian Pan-India Hits" movies={southIndianMovies} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="⚡ High-Octane Action & Mass Masala" movies={southIndianMovies.filter(m => m.genres?.includes('Action'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🏹 Epic Fantasy, Sci-Fi & Mythological" movies={southIndianMovies.filter(m => m.genres?.includes('Sci-Fi') || m.genres?.includes('Fantasy') || m.genres?.includes('Mythology'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🕵️ Crime, Mystery & Suspense Thrillers" movies={southIndianMovies.filter(m => m.genres?.includes('Crime') || m.genres?.includes('Thriller') || m.genres?.includes('Mystery'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          </div>
        </div>
      ) : activeTab === 'bollywood' ? (
        /* Bollywood View with Dedicated Hero Banner */
        <div className="space-y-4">
          <NetflixBillboard
            movies={bollywoodMovies.slice(0, 6)}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
          />
          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            <NetflixRow title="🔥 Trending Bollywood Blockbusters" movies={bollywoodMovies} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="😂 Non-Stop Comedy & Family Entertainers" movies={bollywoodMovies.filter(m => m.genres?.includes('Comedy'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🎭 Drama, Romance & Emotional Superhits" movies={bollywoodMovies.filter(m => m.genres?.includes('Drama') || m.genres?.includes('Romance'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🩸 Dark Thrillers, Action & Crime" movies={bollywoodMovies.filter(m => m.genres?.includes('Action') || m.genres?.includes('Horror') || m.genres?.includes('Thriller'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          </div>
        </div>
      ) : activeTab === 'movies' ? (
        /* Hollywood & Global Movies View with Dedicated Hero Banner */
        <div className="space-y-4">
          <NetflixBillboard
            movies={hollywoodMovies.slice(0, 6)}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
          />
          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            <NetflixRow title="🔥 Hollywood Mega Blockbusters" movies={hollywoodMovies} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🚀 Sci-Fi, Marvel & Multiverse Spectaculars" movies={hollywoodMovies.filter(m => m.genres?.includes('Sci-Fi') || m.genres?.includes('Action'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🎨 Animated & Family Hits" movies={hollywoodMovies.filter(m => m.genres?.includes('Animation') || m.genres?.includes('Family'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🏆 Award-Winning & Critically Acclaimed" movies={hollywoodMovies.filter(m => m.rating >= 8.0)} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          </div>
        </div>
      ) : activeTab === 'kdrama' ? (
        /* K-Dramas & Korean Cinema View with Dedicated Hero Banner */
        <div className="space-y-4">
          <NetflixBillboard
            movies={kdramaList.slice(0, 6)}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
          />
          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            <NetflixRow title="🔥 Top Trending K-Dramas" movies={kdramaList} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="❤️ Romantic & Heartwarming K-Dramas" movies={kdramaList.filter(m => m.genres?.includes('Romance') || m.genres?.includes('Comedy'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🧟 Thriller, Zombie & Dark Fantasy K-Dramas" movies={kdramaList.filter(m => m.genres?.includes('Thriller') || m.genres?.includes('Horror') || m.genres?.includes('Mystery'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          </div>
        </div>
      ) : activeTab === 'anime' ? (
        /* Anime View with Dedicated Hero Banner */
        <div className="space-y-4">
          <NetflixBillboard
            movies={animeList.slice(0, 6)}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
          />
          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            <NetflixRow title="🔥 Trending Shonen & Dark Fantasy Anime" movies={animeList} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="⚡ Action, Superpowers & Battles" movies={animeList.filter(m => m.genres?.includes('Action'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🌸 Supernatural, Isekai & Adventure" movies={animeList.filter(m => m.genres?.includes('Supernatural') || m.genres?.includes('Fantasy') || m.genres?.includes('Adventure'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🎬 Masterpiece Anime Movies" movies={animeList.filter(m => m.type === 'movie')} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          </div>
        </div>
      ) : activeTab === 'series' ? (
        /* TV Series View with Dedicated Hero Banner */
        <div className="space-y-4">
          <NetflixBillboard
            movies={webSeries.slice(0, 6)}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
          />
          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            <NetflixRow title="🔥 Binge-Worthy TV Shows" movies={webSeries} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="🚀 Sci-Fi, Mystery & Supernatural Series" movies={webSeries.filter(m => m.genres?.includes('Sci-Fi') || m.genres?.includes('Mystery'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
            <NetflixRow title="💥 Crime, Thrillers & Drama Series" movies={webSeries.filter(m => m.genres?.includes('Crime') || m.genres?.includes('Drama'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          </div>
        </div>
      ) : (
        /* NETFLIX HOMEPAGE (Full Netflix Experience with Auto-Rotating Hero Carousel) */
        <div className="space-y-4">
          {/* 1. Massive Netflix Billboard Hero with Multi-Banner Auto-Rotation */}
          <NetflixBillboard
            movies={movies.filter(m => m.featured || m.trending).slice(0, 8)}
            movie={heroMovie}
            onPlay={handlePlayMovie}
            onMoreInfo={(m) => setSelectedMovieForInfo(m)}
            onToggleWatchlist={handleToggleWatchlist}
            isWatchlisted={Boolean((heroMovie?.id && watchlistIds.has(heroMovie.id)) || (heroMovie?.tmdbId && watchlistIds.has(heroMovie.tmdbId)))}
          />

          <div className="relative z-20 -mt-16 sm:-mt-24 lg:-mt-32 space-y-4">
            {/* 2. Top 10 in India Today (Numbered Rank Row) */}
            <NetflixRow
              title="Top 10 in India Today"
              movies={top10Trending}
              isTop10={true}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />

            {/* 3. Continue Watching */}
            {history.length > 0 && (
              <NetflixRow
                title={`Continue Watching for ${currentUser ? currentUser.username : 'You'}`}
                movies={history}
                onSelectMovie={setSelectedMovieForInfo}
                onPlayMovie={handlePlayMovie}
                onToggleWatchlist={handleToggleWatchlist}
                watchlistIds={watchlistIds}
              />
            )}

            {/* 4. 🏹 South Indian Pan-India Blockbusters */}
            <NetflixRow
              title="🏹 South Indian Pan-India Blockbusters"
              movies={southIndianMovies}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />

            {/* 5. 🇮🇳 Bollywood Hits (Hindi) */}
            <NetflixRow
              title="🇮🇳 Bollywood Hits (Hindi Cinema)"
              movies={bollywoodMovies}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />

            {/* 6. 🌍 Hollywood Action & Sci-Fi Blockbusters */}
            <NetflixRow
              title="🌍 Hollywood Blockbusters & Marvel Hits"
              movies={hollywoodMovies}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />

            {/* 7. 🇰🇷 K-Dramas & Korean Cinema */}
            <NetflixRow
              title="🇰🇷 Trending K-Dramas & Korean Cinema"
              movies={kdramaList}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />

            {/* 8. ⚔️ Anime Spotlight */}
            <NetflixRow
              title="⚔️ Popular Anime Series & Movies"
              movies={animeList}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />

            {/* 9. 📺 Binge-Worthy TV Shows */}
            <NetflixRow
              title="📺 Binge-Worthy TV Series & Web Shows"
              movies={webSeries}
              onSelectMovie={setSelectedMovieForInfo}
              onPlayMovie={handlePlayMovie}
              onToggleWatchlist={handleToggleWatchlist}
              watchlistIds={watchlistIds}
            />
          </div>
        </div>
      )}

      {/* Netflix Footer */}
      <NetflixFooter />

      {/* Netflix More Info Detailed Modal */}
      {selectedMovieForInfo && (
        <NetflixInfoModal
          movie={selectedMovieForInfo}
          allMovies={movies}
          onClose={() => setSelectedMovieForInfo(null)}
          onPlay={handlePlayMovie}
          onSelectMovie={(m) => setSelectedMovieForInfo(m)}
          onToggleWatchlist={handleToggleWatchlist}
          isWatchlisted={Boolean((selectedMovieForInfo.id && watchlistIds.has(selectedMovieForInfo.id)) || (selectedMovieForInfo.tmdbId && watchlistIds.has(selectedMovieForInfo.tmdbId)))}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onClearCache={() => {
          localStorage.clear();
          showToast('All local storage & history reset');
          setIsSettingsOpen(false);
          window.location.reload();
        }}
      />

      {/* Custom Stream & Scraping Modal */}
      <CustomStreamModal
        isOpen={isCustomStreamOpen}
        onClose={() => setIsCustomStreamOpen(false)}
        onStreamReady={(m) => {
          handlePlayMovie(m);
        }}
      />

      {/* Netflix Mobile Native Bottom Navigation Bar */}
      <NetflixMobileNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setWatchMovie(null);
          setSelectedMovieForInfo(null);
          setSearchQuery('');
        }}
        watchlistCount={watchlist.length}
        onOpenSearch={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const searchInput = document.querySelector('header input') as HTMLInputElement | null;
          if (searchInput) {
            searchInput.focus();
          }
        }}
      />
    </div>
  );
};

export default App;
