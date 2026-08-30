import { createClient } from '@supabase/supabase-js';
import type { Movie } from '../types/movie';

export const SUPABASE_URL = 'https://ukhhpcvkxzrmfhqkxapd.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVraGhwY3ZreHpybWZocWt4YXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwNzU5MjAsImV4cCI6MjEwMzY1MTkyMH0.DbHQjP4ZfRD-3zArnKlzvNyDfxo_JgIAYXyoNlARQ4g';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch movies from Supabase cloud database
 */
export async function getCloudMovies(): Promise<Movie[] | null> {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase movies query (using local catalog fallback):', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((item: any) => {
        const title = item.title || 'Untitled';
        const id = String(item.id || item.tmdb_id || '1');
        return {
          id,
          _id: id,
          title,
          slug: item.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`,
          description: item.description || '',
          releaseYear: Number(item.release_year || item.releaseYear) || 2024,
          duration: item.duration || '2h 10m',
          genres: item.genres || ['Action'],
          rating: Number(item.rating) || 8.5,
          posterUrl: item.poster_url || item.posterUrl || '',
          backdropUrl: item.backdrop_url || item.backdropUrl || '',
          featured: Boolean(item.featured),
          trending: Boolean(item.trending),
          type: item.type || 'movie',
          videoUrl: item.video_url || item.videoUrl || '',
          tmdbId: item.tmdb_id || item.tmdbId,
          language: item.language || 'Hindi',
          director: item.director,
          cast: item.cast || item.starring || item.actors || [],
          qualities: item.qualities || [
            { quality: '1080p', videoUrl: item.video_url || item.videoUrl || '' }
          ]
        };
      });
    }

    return null;
  } catch (err) {
    console.warn('Supabase connection error:', err);
    return null;
  }
}

/**
 * Cloud Watchlist Sync (Syncs across all user devices)
 */
export async function syncCloudWatchlist(userId: string, movie: Movie, isAdd: boolean): Promise<boolean> {
  try {
    if (!userId) return false;
    const movieId = movie.tmdbId || movie.id;

    if (isAdd) {
      const { error } = await supabase
        .from('watchlist')
        .upsert({
          user_id: userId,
          movie_id: movieId,
          movie_data: movie,
          created_at: new Date().toISOString()
        });
      return !error;
    } else {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .match({ user_id: userId, movie_id: movieId });
      return !error;
    }
  } catch {
    return false;
  }
}

/**
 * Cloud Watch History Sync (Save Resume Progress)
 */
export async function syncCloudHistory(userId: string, movie: Movie, progressSeconds: number = 0): Promise<boolean> {
  try {
    if (!userId) return false;
    const movieId = movie.tmdbId || movie.id;

    const { error } = await supabase
      .from('watch_history')
      .upsert({
        user_id: userId,
        movie_id: movieId,
        movie_data: movie,
        progress_seconds: progressSeconds,
        updated_at: new Date().toISOString()
      });

    return !error;
  } catch {
    return false;
  }
}
