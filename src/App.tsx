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
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { CheckCircle2, Bookmark, Play, Check } from 'lucide-react';

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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('cinevault_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cinevault_token'));
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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

  const handleLoginSuccess = (user: AuthUser, authToken: string) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('cinevault_user', JSON.stringify(user));
    localStorage.setItem('cinevault_token', authToken);
    showToast(`Welcome back, ${user.username}!`);
    if (user.role === 'admin') {
      setIsAdminOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('cinevault_user');
    localStorage.removeItem('cinevault_token');
    setIsAdminOpen(false);
    showToast('Signed out successfully');
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
    return movies.filter((m) => m.genres?.includes('Bollywood') || m.language?.toLowerCase().includes('hindi'));
  }, [movies]);

  const southIndianMovies = useMemo(() => {
    return movies.filter(
      (m) =>
        m.genres?.includes('South Indian') ||
        m.language?.toLowerCase().includes('telugu') ||
        m.language?.toLowerCase().includes('tamil') ||
        m.language?.toLowerCase().includes('kannada') ||
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
          m.type === 'movie')
    );
  }, [movies]);

  const webSeries = useMemo(() => {
    return movies.filter((m) => m.type === 'series' && !m.genres?.includes('Anime'));
  }, [movies]);

  const animeList = useMemo(() => {
    return movies.filter((m) => m.genres?.includes('Anime') || m.language?.toLowerCase().includes('japanese'));
  }, [movies]);

  // Search Results
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  useEffect(() => {
    if (searchQuery.trim()) {
      api.search(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
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
        /* Netflix Search Results Grid */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-300">
            Explore titles related to: <span className="text-white font-extrabold font-display">"{searchQuery}"</span>
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {searchResults.map((m) => (
              <div
                key={m.id || m.tmdbId}
                onClick={() => setSelectedMovieForInfo(m)}
                className="bg-[#202020] rounded overflow-hidden netflix-card-hover cursor-pointer shadow-md group"
              >
                <div className="aspect-[2/3] relative overflow-hidden bg-zinc-900">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayMovie(m);
                      }}
                      className="p-3 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-lg cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 space-y-1 bg-[#181818]">
                  <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="text-[#46d369] font-bold">98% Match</span>
                    <span>{m.releaseYear}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        /* South Indian View */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">🏹 South Indian Pan-India Blockbusters</h1>
          <NetflixRow title="Top South Indian Hits" movies={southIndianMovies} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          <NetflixRow title="Action & Mass Masala" movies={southIndianMovies.filter(m => m.genres?.includes('Action'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
        </div>
      ) : activeTab === 'bollywood' ? (
        /* Bollywood View */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">🇮🇳 Bollywood Hits (Hindi Cinema)</h1>
          <NetflixRow title="Trending Bollywood" movies={bollywoodMovies} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          <NetflixRow title="Romantic & Drama Hits" movies={bollywoodMovies.filter(m => m.genres?.includes('Drama') || m.genres?.includes('Romance'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
        </div>
      ) : activeTab === 'series' ? (
        /* TV Series View */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">📺 TV Shows & Web Series</h1>
          <NetflixRow title="Binge-Worthy TV Shows" movies={webSeries} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
          <NetflixRow title="Sci-Fi & Action Series" movies={webSeries.filter(m => m.genres?.includes('Sci-Fi') || m.genres?.includes('Action'))} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
        </div>
      ) : activeTab === 'anime' ? (
        /* Anime View */
        <div className="pt-28 px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">⚔️ Popular Anime Spotlight</h1>
          <NetflixRow title="Trending Anime" movies={animeList} onSelectMovie={setSelectedMovieForInfo} onPlayMovie={handlePlayMovie} onToggleWatchlist={handleToggleWatchlist} watchlistIds={watchlistIds} />
        </div>
      ) : (
        /* NETFLIX HOMEPAGE (Full Netflix Experience) */
        <div className="space-y-4">
          {/* 1. Massive Netflix Billboard Hero */}
          {heroMovie && (
            <NetflixBillboard
              movie={heroMovie}
              onPlay={handlePlayMovie}
              onMoreInfo={(m) => setSelectedMovieForInfo(m)}
              onToggleWatchlist={handleToggleWatchlist}
              isWatchlisted={Boolean((heroMovie.id && watchlistIds.has(heroMovie.id)) || (heroMovie.tmdbId && watchlistIds.has(heroMovie.tmdbId)))}
            />
          )}

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

            {/* 7. 📺 Binge-Worthy TV Shows */}
            <NetflixRow
              title="📺 Binge-Worthy TV Series & K-Dramas"
              movies={webSeries}
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

      {/* Admin Dashboard Modal */}
      {isAdminOpen && (
        <AdminDashboard
          movies={movies}
          token={token}
          onClose={() => setIsAdminOpen(false)}
          onRefreshMovies={fetchAllMovies}
        />
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <LoginPage
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

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
