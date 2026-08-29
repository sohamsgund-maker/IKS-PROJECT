import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '..', 'data', 'indexed_tmdb_movies.json');
const outputPath = path.join(__dirname, '..', '..', 'src', 'data', 'tmdbImportedMovies.ts');

const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';

async function fetchTMDBDetails(id) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function run() {
  console.log('🚀 Reading indexed TMDB movies from:', inputPath);
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Indexed TMDB file not found!');
    return;
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const items = JSON.parse(raw);

  // Pick top 80 most popular movies
  const topCandidates = items.slice(0, 90);
  console.log(`📡 Enriching top ${topCandidates.length} high-popularity movies via TMDB API...`);

  const enrichedMovies = [];

  for (let i = 0; i < topCandidates.length; i++) {
    const candidate = topCandidates[i];
    const data = await fetchTMDBDetails(candidate.id);
    if (!data || !data.poster_path) continue;

    const releaseYear = parseInt((data.release_date || '2024').substring(0, 4), 10) || 2024;
    const genres = (data.genres || []).map(g => g.name);

    // Language mapping
    let language = 'English';
    if (data.original_language === 'hi') {
      language = 'Hindi (Bollywood)';
      if (!genres.includes('Bollywood')) genres.push('Bollywood');
    } else if (['te', 'ta', 'kn', 'ml'].includes(data.original_language)) {
      language = data.original_language === 'te' ? 'Telugu (South)' : (data.original_language === 'ta' ? 'Tamil (South)' : (data.original_language === 'kn' ? 'Kannada (South)' : 'Malayalam (South)'));
      if (!genres.includes('South Indian')) genres.push('South Indian');
    } else if (data.original_language === 'ja') {
      language = 'Japanese (Anime)';
      if (!genres.includes('Anime')) genres.push('Anime');
    } else if (data.original_language === 'en') {
      language = 'English (Hollywood)';
      if (!genres.includes('Hollywood')) genres.push('Hollywood');
    }

    const cast = (data.credits?.cast || []).slice(0, 4).map(c => c.name);
    const director = data.credits?.crew?.find(c => c.job === 'Director')?.name || 'Renowned Filmmaker';

    const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

    enrichedMovies.push({
      _id: String(data.id),
      id: String(data.id),
      tmdbId: data.id,
      title: data.title || candidate.title,
      slug: `${(data.title || candidate.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${data.id}`,
      description: data.overview || 'Experience this blockbuster in 1080p Full HD with multi-audio and high-speed streaming on CineVault.',
      posterUrl: `https://image.tmdb.org/t/p/w780${data.poster_path}`,
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : `https://image.tmdb.org/t/p/w780${data.poster_path}`,
      trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(data.title + ' trailer')}`,
      releaseYear,
      language,
      genres: genres.length > 0 ? genres : ['Action', 'Drama'],
      duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : '2h 15m',
      rating: parseFloat((data.vote_average || 7.8).toFixed(1)),
      director,
      cast: cast.length > 0 ? cast : ['Star Cast'],
      type: 'movie',
      featured: i < 5,
      trending: true,
      videoUrl: sampleVideo,
      downloadUrl: sampleVideo,
      qualities: [
        { quality: '1080p', videoUrl: sampleVideo, downloadUrl: sampleVideo, fileSize: '2.4 GB' },
        { quality: '720p', videoUrl: sampleVideo, downloadUrl: sampleVideo, fileSize: '1.2 GB' },
        { quality: '480p', videoUrl: sampleVideo, downloadUrl: sampleVideo, fileSize: '550 MB' }
      ]
    });

    console.log(`[${i + 1}/${topCandidates.length}] ✅ Enriched: ${data.title} (${releaseYear})`);
  }

  const fileContent = `import type { Movie } from '../types/movie';\n\nexport const TMDB_IMPORTED_MOVIES: Movie[] = ${JSON.stringify(enrichedMovies, null, 2)};\n`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`💾 Successfully exported ${enrichedMovies.length} fully enriched TMDB movies to ${outputPath}!`);
}

run().catch(console.error);
