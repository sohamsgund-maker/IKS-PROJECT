export class MetadataService {
  static normalizeMovieItem(raw) {
    const isMovie = raw.media_type === 'movie' || Boolean(raw.title);
    const releaseDate = raw.release_date || raw.first_air_date || '';
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;

    return {
      id: raw.id,
      title: raw.title || raw.name || 'Untitled',
      originalTitle: raw.original_title || raw.original_name || '',
      type: isMovie ? 'movie' : 'series',
      overview: raw.overview || 'No overview available.',
      releaseDate,
      releaseYear,
      rating: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : 0,
      voteCount: raw.vote_count || 0,
      popularity: raw.popularity || 0,
      posterUrl: raw.poster_path ? `https://image.tmdb.org/t/p/w500${raw.poster_path}` : null,
      backdropUrl: raw.backdrop_path ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}` : null,
      originalLanguage: raw.original_language || 'en',
    };
  }

  static normalizeMovieDetails(raw) {
    const releaseDate = raw.release_date || '';
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const runtime = raw.runtime || 0;
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    const durationFormatted = runtime > 0 ? `${hours}h ${minutes}m` : 'N/A';

    const director = raw.credits?.crew?.find((c) => c.job === 'Director')?.name || 'N/A';
    const cast = (raw.credits?.cast || []).slice(0, 8).map((c) => c.name);

    return {
      id: raw.id,
      title: raw.title || raw.name || 'Untitled',
      tagline: raw.tagline || '',
      overview: raw.overview || 'No synopsis available.',
      releaseDate,
      releaseYear,
      runtime,
      durationFormatted,
      rating: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : 0,
      voteCount: raw.vote_count || 0,
      genres: (raw.genres || []).map((g) => g.name),
      director,
      cast,
      posterUrl: raw.poster_path ? `https://image.tmdb.org/t/p/w500${raw.poster_path}` : null,
      backdropUrl: raw.backdrop_path ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}` : null,
      status: raw.status || 'Released',
      budget: raw.budget || 0,
      revenue: raw.revenue || 0,
      homepage: raw.homepage || null,
      spokenLanguages: (raw.spoken_languages || []).map((l) => l.english_name),
    };
  }
}
