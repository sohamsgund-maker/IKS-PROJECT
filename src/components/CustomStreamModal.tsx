import React, { useState } from 'react';
import { X, Play, Link, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import type { Movie } from '../types/movie';

interface CustomStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStreamReady: (movie: Movie) => void;
}

export const CustomStreamModal: React.FC<CustomStreamModalProps> = ({
  isOpen,
  onClose,
  onStreamReady,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const movie = await api.fetchFromExternalUrlOrId(inputUrl.trim());
      onStreamReady(movie);
      onClose();
      setInputUrl('');
    } catch (err: any) {
      setError(err.message || 'Failed to parse stream URL or TMDB ID');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickExample = (url: string) => {
    setInputUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12121a] border border-white/[0.1] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7c5cff]/20 text-[#a28bff] grid place-items-center">
              <Link className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Stream Any Movie or Series</h2>
              <p className="text-xs text-zinc-400">Paste any Netplay URL, TMDB ID, or stream link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white grid place-items-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Movie URL or TMDB ID
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. https://netplay-one.vercel.app/movie/1213243 or 1213243"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/[0.1] focus:border-[#7c5cff] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Examples */}
          <div className="space-y-2">
            <span className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
              Quick Try:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickExample('https://netplay-one.vercel.app/movie/1213243')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition cursor-pointer"
              >
                Inside Out 2 (Netplay Link)
              </button>
              <button
                type="button"
                onClick={() => handleQuickExample('533535')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition cursor-pointer"
              >
                Deadpool & Wolverine (ID: 533535)
              </button>
              <button
                type="button"
                onClick={() => handleQuickExample('94605')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition cursor-pointer"
              >
                Arcane Series (ID: 94605)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7c5cff] hover:bg-[#6a46ff] text-white shadow-lg shadow-purple-500/30 transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Loading Stream...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Stream</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
