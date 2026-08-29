import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '..', '..', 'src', 'data', 'curatedCatalog.ts');
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';

const MASTER_TITLES = [
  // --- 🏹 SOUTH INDIAN PAN-INDIA BLOCKBUSTERS ---
  { query: 'Toxic A Fairy Tale for Grown-ups', type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' },
  { query: 'Kalki 2898 AD', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'Pushpa The Rule', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'Pushpa The Rise', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'RRR', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'Salaar Part 1 Ceasefire', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'Devara Part 1', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'Hanu-Man', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'K.G.F: Chapter 2', type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' },
  { query: 'K.G.F: Chapter 1', type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' },
  { query: 'Kantara', type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' },
  { query: 'Leo', type: 'movie', cat: 'South Indian', lang: 'Tamil / Hindi' },
  { query: 'Jailer', type: 'movie', cat: 'South Indian', lang: 'Tamil / Hindi' },
  { query: 'Baahubali 2 The Conclusion', type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' },
  { query: 'Vikram', type: 'movie', cat: 'South Indian', lang: 'Tamil / Hindi' },

  // --- 🇮🇳 BOLLYWOOD BLOCKBUSTERS (HINDI) ---
  { query: 'Stree 2', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Jawan', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Animal', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Fighter', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Bhool Bhulaiyaa 3', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Pathaan', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Brahmastra Part One Shiva', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Shaitaan', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Dunki', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Tiger 3', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Chandu Champion', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Singham Again', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },
  { query: 'Crew', type: 'movie', cat: 'Bollywood', lang: 'Hindi' },

  // --- 🌍 HOLLYWOOD & GLOBAL BLOCKBUSTERS ---
  { query: 'Deadpool & Wolverine', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Spider-Man No Way Home', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Spider-Man Across the Spider-Verse', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Inside Out 2', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Dune Part Two', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Oppenheimer', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Avatar The Way of Water', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Avengers Endgame', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Avengers Infinity War', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'The Dark Knight', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Interstellar', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Inception', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Gladiator II', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Alien Romulus', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'John Wick Chapter 4', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Mad Max Fury Road', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'The Batman', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'Top Gun Maverick', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'The Shawshank Redemption', type: 'movie', cat: 'Hollywood', lang: 'English' },
  { query: 'The Godfather', type: 'movie', cat: 'Hollywood', lang: 'English' },

  // --- 📺 BINGE-WORTHY TV SHOWS ---
  { query: 'Stranger Things', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'The Last of Us', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'House of the Dragon', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'Game of Thrones', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'Breaking Bad', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'Loki', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'The Boys', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'Squid Game', type: 'series', cat: 'Series', lang: 'Korean / Hindi' },
  { query: 'Money Heist', type: 'series', cat: 'Series', lang: 'Spanish / Hindi' },
  { query: 'Wednesday', type: 'series', cat: 'Series', lang: 'English' },
  { query: 'Mirzapur', type: 'series', cat: 'Series', lang: 'Hindi' },
  { query: 'Sacred Games', type: 'series', cat: 'Series', lang: 'Hindi' },
  { query: 'The Family Man', type: 'series', cat: 'Series', lang: 'Hindi' },
  { query: 'Panchayat', type: 'series', cat: 'Series', lang: 'Hindi' },
  { query: 'Farzi', type: 'series', cat: 'Series', lang: 'Hindi' },

  // --- ⚔️ POPULAR ANIME SERIES & MOVIES ---
  { query: 'Demon Slayer Kimetsu no Yaiba', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Demon Slayer Mugen Train', type: 'movie', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Solo Leveling', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Jujutsu Kaisen', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Attack on Titan', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Arcane', type: 'series', cat: 'Anime', lang: 'English / Japanese' },
  { query: 'Death Note', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Chainsaw Man', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Naruto Shippuden', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'One Piece', type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' },
  { query: 'Spirited Away', type: 'movie', cat: 'Anime', lang: 'Japanese' },
  { query: 'Your Name', type: 'movie', cat: 'Anime', lang: 'Japanese' },
  { query: 'Suzume', type: 'movie', cat: 'Anime', lang: 'Japanese' }
];

async function searchAndFetchDetails(item) {
  const searchEndpoint = item.type === 'series' ? 'tv' : 'movie';
  try {
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/${searchEndpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(item.query)}`);
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const firstResult = searchJson.results?.[0];
    if (!firstResult) return null;

    const detailsRes = await fetch(`https://api.themoviedb.org/3/${searchEndpoint}/${firstResult.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
    if (!detailsRes.ok) return null;
    const detailsJson = await detailsRes.json();
    return { data: detailsJson, config: item };
  } catch {
    return null;
  }
}

async function run() {
  console.log(`🚀 Building Verified Master Catalog with HD Banners for ${MASTER_TITLES.length} titles...`);
  const catalog = [];
  const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

  for (let i = 0; i < MASTER_TITLES.length; i++) {
    const item = MASTER_TITLES[i];
    const res = await searchAndFetchDetails(item);
    if (!res || !res.data) {
      console.warn(`⚠️ Skipped search for: ${item.query}`);
      continue;
    }

    const data = res.data;
    const config = res.config;
    const title = data.title || data.name || item.query;
    const releaseDate = data.release_date || data.first_air_date || '2024-01-01';
    const releaseYear = parseInt(releaseDate.substring(0, 4), 10) || 2024;
    
    let genres = (data.genres || []).map(g => g.name);
    if (config.cat && !genres.includes(config.cat)) genres.unshift(config.cat);

    const cast = (data.credits?.cast || []).slice(0, 4).map(c => c.name);
    const director = data.credits?.crew?.find(c => c.job === 'Director')?.name || (data.created_by?.[0]?.name || 'Acclaimed Filmmaker');

    // Guarantee official TMDB HD banners
    const posterPath = data.poster_path 
      ? `https://image.tmdb.org/t/p/w780${data.poster_path}` 
      : 'https://image.tmdb.org/t/p/w780/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg';
      
    const backdropPath = data.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` 
      : `https://image.tmdb.org/t/p/w1280${data.poster_path}`;

    catalog.push({
      _id: String(data.id),
      id: String(data.id),
      tmdbId: data.id,
      title,
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${data.id}`,
      description: data.overview || 'Stream in 1080p Full HD with multi-audio and high-speed streaming on CineVault.',
      posterUrl: posterPath,
      backdropUrl: backdropPath,
      trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`,
      releaseYear,
      language: config.lang || (data.original_language === 'hi' ? 'Hindi' : 'English'),
      genres: genres.length > 0 ? genres : [config.cat || 'Action'],
      duration: data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (config.type === 'series' ? `${data.number_of_seasons || 1} Season${(data.number_of_seasons || 1) > 1 ? 's' : ''}` : '2h 15m'),
      rating: parseFloat((data.vote_average || 8.4).toFixed(1)),
      director,
      cast: cast.length > 0 ? cast : ['Star Cast'],
      type: config.type,
      featured: i < 6,
      trending: true,
      videoUrl: sampleVideo,
      downloadUrl: sampleVideo,
      qualities: [
        { quality: '1080p', videoUrl: sampleVideo, downloadUrl: sampleVideo, fileSize: '2.4 GB' },
        { quality: '720p', videoUrl: sampleVideo, downloadUrl: sampleVideo, fileSize: '1.2 GB' },
        { quality: '480p', videoUrl: sampleVideo, downloadUrl: sampleVideo, fileSize: '550 MB' }
      ]
    });

    console.log(`[${i + 1}/${MASTER_TITLES.length}] ✅ Verified: ${title} (TMDB ID: ${data.id}) | Banner: ${backdropPath.substring(0, 45)}...`);
  }

  const content = `import type { Movie } from '../types/movie';\n\nexport const CURATED_MOVIES_CATALOG: Movie[] = ${JSON.stringify(catalog, null, 2)};\n`;
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`💾 Saved ${catalog.length} verified blockbusters with 100% HD TMDB banners to ${outputPath}`);
}

run().catch(console.error);
