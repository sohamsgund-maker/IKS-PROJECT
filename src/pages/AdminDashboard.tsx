import React, { useState } from 'react';
import { X, Trash2, Edit3, Shield, Film } from 'lucide-react';
import type { Movie, MovieQuality } from '../types/movie';
import { api } from '../services/api';

interface AdminDashboardProps {
  movies: Movie[];
  token: string | null;
  onClose: () => void;
  onRefreshMovies: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  movies,
  token,
  onClose,
  onRefreshMovies,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('2026');
  const [language, setLanguage] = useState('English');
  const [genre, setGenre] = useState('Action');
  const [duration, setDuration] = useState('2h 00m');
  const [rating, setRating] = useState('8.4');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [type, setType] = useState<'movie' | 'series'>('movie');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(true);
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');
  const [downloadUrl, setDownloadUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4');

  const [qualities] = useState<MovieQuality[]>([
    { quality: '720p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', fileSize: '320 MB' },
    { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', fileSize: '480 MB' }
  ]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !posterUrl.trim() || !videoUrl.trim()) {
      alert('Please fill in Title, Poster URL, and Video Stream URL.');
      return;
    }

    const moviePayload: Partial<Movie> = {
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim() || 'Exciting title streaming now on CineVault.',
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl.trim() || posterUrl.trim(),
      trailerUrl: trailerUrl.trim(),
      releaseYear: parseInt(releaseYear) || 2026,
      language: language.trim() || 'English',
      genres: [genre],
      duration: duration.trim() || '2h 00m',
      rating: parseFloat(rating) || 8.0,
      director: director.trim(),
      cast: cast.split(',').map(c => c.trim()).filter(Boolean),
      type,
      featured,
      trending,
      qualities: qualities.length > 0 ? qualities : [{ quality: '1080p', videoUrl, downloadUrl }],
      videoUrl: videoUrl.trim(),
      downloadUrl: downloadUrl.trim()
    };

    if (editingId) {
      await api.updateMovie(editingId, moviePayload, token || '');
    } else {
      await api.createMovie(moviePayload, token || '');
    }

    onRefreshMovies();
    resetForm();
  };

  const handleEdit = (m: Movie) => {
    setEditingId(m._id || m.id || null);
    setTitle(m.title);
    setSlug(m.slug);
    setDescription(m.description);
    setPosterUrl(m.posterUrl);
    setBackdropUrl(m.backdropUrl || '');
    setTrailerUrl(m.trailerUrl || '');
    setReleaseYear(m.releaseYear.toString());
    setLanguage(m.language);
    setGenre(m.genres[0] || 'Action');
    setDuration(m.duration);
    setRating(m.rating.toString());
    setDirector(m.director || '');
    setCast(m.cast?.join(', ') || '');
    setType(m.type);
    setFeatured(Boolean(m.featured));
    setTrending(Boolean(m.trending));
    setVideoUrl(m.videoUrl);
    setDownloadUrl(m.downloadUrl || '');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this movie?')) {
      await api.deleteMovie(id, token || '');
      onRefreshMovies();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setPosterUrl('');
    setBackdropUrl('');
    setTrailerUrl('');
    setDirector('');
    setCast('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-zinc-100 max-h-[92vh] flex flex-col space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">CineVault Admin Dashboard</h2>
              <p className="text-xs text-zinc-400">Add, edit, manage authorized streaming & download links</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Add / Edit Form */}
          <form onSubmit={handleSave} className="space-y-4 bg-zinc-950 p-5 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="font-bold text-sm text-red-400 flex items-center gap-1.5">
                <Film className="w-4 h-4" />
                {editingId ? 'Edit Movie Record' : '+ Add New Movie'}
              </h3>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-xs text-zinc-400 hover:text-white underline">
                  Switch to Add New
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Movie Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inception"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Poster Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Authorized Video Stream URL (.mp4) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://commondatastorage.googleapis.com/.../movie.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Authorized Download URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://commondatastorage.googleapis.com/.../movie.mp4"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Genre</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white">
                  {['Action', 'Sci-Fi', 'Drama', 'Animation', 'Comedy', 'Thriller', 'Adventure', 'Fantasy'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white">
                  <option value="movie">Movie</option>
                  <option value="series">Web Series</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Release Year</label>
                <input type="text" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white" />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Rating (0 - 10)</label>
                <input type="text" value={rating} onChange={(e) => setRating(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-zinc-300 mb-1">Description / Synopsis</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Synopsis of the movie..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 font-semibold">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-red-600" /> Featured Hero
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300 font-semibold">
                  <input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} className="accent-red-600" /> Trending Movie
                </label>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 font-semibold">
                    Cancel
                  </button>
                )}
                <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-500 font-bold rounded-xl text-white shadow-lg shadow-red-600/30 cursor-pointer">
                  {editingId ? 'Update Movie' : 'Save Movie'}
                </button>
              </div>
            </div>
          </form>

          {/* Database Items List */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-zinc-300">Existing Movies in Database ({movies.length})</h3>
            <div className="space-y-2">
              {movies.map((m) => (
                <div key={m._id || m.id || m.slug} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={m.posterUrl} alt={m.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{m.title}</h4>
                      <p className="text-zinc-500 text-xs truncate">
                        {m.releaseYear} • {m.genres?.join(', ')} • ⭐ {m.rating} • {m.type.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => (m._id || m.id) && handleDelete(m._id || m.id!)}
                      className="p-2 bg-red-950/60 hover:bg-red-900 text-red-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
