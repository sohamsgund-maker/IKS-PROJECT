export interface MovieQuality {
  quality: '480p' | '720p' | '1080p' | '4K';
  videoUrl: string;
  downloadUrl?: string;
  fileSize?: string;
}

export interface Subtitle {
  language: string;
  src: string;
  label: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  language: string;
  nativeName?: string;
  flag?: string;
  url?: string;
  isDefault?: boolean;
}

export interface StreamInfoResponse {
  tmdbId: number | string;
  title: string;
  defaultLanguage: string;
  isHindiAvailable?: boolean;
  audioTracks: AudioTrack[];
  qualities: MovieQuality[];
  subtitles: Subtitle[];
  directStreamUrl?: string;
  fallbackEmbedUrl?: string;
}

export interface Episode {
  season: number;
  episode: number;
  title: string;
  duration?: string;
  videoUrl?: string;
}

export interface Movie {
  _id?: string;
  id?: string;
  tmdbId?: number | string;
  imdbId?: string;
  title: string;
  slug: string;
  description: string;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  releaseYear: number;
  language: string;
  originalLanguage?: string;
  genres: string[];
  duration: string;
  rating: number;
  director: string;
  cast: string[];
  type: 'movie' | 'series';
  featured?: boolean;
  trending?: boolean;
  qualities: MovieQuality[];
  videoUrl: string;
  downloadUrl?: string;
  subtitles?: Subtitle[];
  audioTracks?: AudioTrack[];
  episodes?: Episode[];
  source?: string;
  subjectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}
