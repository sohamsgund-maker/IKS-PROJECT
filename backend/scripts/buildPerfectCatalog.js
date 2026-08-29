import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '..', '..', 'src', 'data', 'curatedCatalog.ts');
const TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';

const CURATED_LIST = [
  // --- 🏹 SOUTH INDIAN PAN-INDIA HITS ---
  { id: 1213243, type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi', customDesc: 'A powerful drug cartel pulls the strings behind a facade of sun-soaked beaches as a gritty, violent underworld power struggle emerges during the crumbling of Portuguese colonial rule. Starring Rocking Star Yash.' },
  { id: 822119, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Kalki 2898 AD
  { id: 786892, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Pushpa 2: The Rule
  { id: 693134, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Pushpa: The Rise
  { id: 579974, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // RRR
  { id: 897087, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Salaar: Part 1 - Ceasefire
  { id: 1072790, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Devara: Part 1
  { id: 998846, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Hanu-Man
  { id: 603692, type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' }, // K.G.F: Chapter 2
  { id: 554592, type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' }, // K.G.F: Chapter 1
  { id: 1013860, type: 'movie', cat: 'South Indian', lang: 'Kannada / Hindi' }, // Kantara
  { id: 1075794, type: 'movie', cat: 'South Indian', lang: 'Tamil / Hindi' }, // Leo
  { id: 966719, type: 'movie', cat: 'South Indian', lang: 'Tamil / Hindi' }, // Jailer
  { id: 350312, type: 'movie', cat: 'South Indian', lang: 'Telugu / Hindi' }, // Baahubali 2: The Conclusion
  { id: 744276, type: 'movie', cat: 'South Indian', lang: 'Tamil / Hindi' }, // Vikram

  // --- 🇮🇳 BOLLYWOOD HITS (HINDI) ---
  { id: 1079091, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Stree 2
  { id: 872906, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Jawan
  { id: 781732, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Animal
  { id: 805320, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Fighter
  { id: 1226578, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Bhool Bhulaiyaa 3
  { id: 864692, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Pathaan
  { id: 496339, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Brahmastra Part One
  { id: 1226306, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Shaitaan
  { id: 967847, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Dunki
  { id: 787699, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Tiger 3
  { id: 1154347, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Chandu Champion
  { id: 1084199, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Singham Again
  { id: 1094556, type: 'movie', cat: 'Bollywood', lang: 'Hindi' }, // Crew

  // --- 🌍 HOLLYWOOD & GLOBAL BLOCKBUSTERS ---
  { id: 533535, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Deadpool & Wolverine
  { id: 634649, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Spider-Man: No Way Home
  { id: 569094, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Spider-Man: Across the Spider-Verse
  { id: 1022789, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Inside Out 2
  { id: 872585, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Oppenheimer
  { id: 76600, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Avatar: The Way of Water
  { id: 299534, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Avengers: Endgame
  { id: 299536, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Avengers: Infinity War
  { id: 155, type: 'movie', cat: 'Hollywood', lang: 'English' }, // The Dark Knight
  { id: 157336, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Interstellar
  { id: 27205, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Inception
  { id: 558449, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Gladiator II
  { id: 945961, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Alien: Romulus
  { id: 76341, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Mad Max: Fury Road
  { id: 414906, type: 'movie', cat: 'Hollywood', lang: 'English' }, // The Batman
  { id: 361743, type: 'movie', cat: 'Hollywood', lang: 'English' }, // Top Gun: Maverick
  { id: 238, type: 'movie', cat: 'Hollywood', lang: 'English' }, // The Godfather
  { id: 278, type: 'movie', cat: 'Hollywood', lang: 'English' }, // The Shawshank Redemption

  // --- 📺 BINGE-WORTHY TV SHOWS ---
  { id: 66732, type: 'series', cat: 'Series', lang: 'English' }, // Stranger Things
  { id: 100088, type: 'series', cat: 'Series', lang: 'English' }, // The Last of Us
  { id: 94997, type: 'series', cat: 'Series', lang: 'English' }, // House of the Dragon
  { id: 1399, type: 'series', cat: 'Series', lang: 'English' }, // Game of Thrones
  { id: 1396, type: 'series', cat: 'Series', lang: 'English' }, // Breaking Bad
  { id: 84958, type: 'series', cat: 'Series', lang: 'English' }, // Loki
  { id: 76479, type: 'series', cat: 'Series', lang: 'English' }, // The Boys
  { id: 93405, type: 'series', cat: 'Series', lang: 'Korean / Hindi' }, // Squid Game
  { id: 71446, type: 'series', cat: 'Series', lang: 'Spanish / Hindi' }, // Money Heist
  { id: 119051, type: 'series', cat: 'Series', lang: 'English' }, // Wednesday
  { id: 84423, type: 'series', cat: 'Series', lang: 'Hindi' }, // Mirzapur
  { id: 79352, type: 'series', cat: 'Series', lang: 'Hindi' }, // Sacred Games
  { id: 93414, type: 'series', cat: 'Series', lang: 'Hindi' }, // The Family Man
  { id: 100757, type: 'series', cat: 'Series', lang: 'Hindi' }, // Panchayat
  { id: 120998, type: 'series', cat: 'Series', lang: 'Hindi' }, // Farzi

  // --- ⚔️ POPULAR ANIME SERIES & MOVIES ---
  { id: 85937, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Demon Slayer
  { id: 635302, type: 'movie', cat: 'Anime', lang: 'Japanese / Hindi' }, // Demon Slayer: Mugen Train
  { id: 127532, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Solo Leveling
  { id: 95479, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Jujutsu Kaisen
  { id: 1429, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Attack on Titan
  { id: 94605, type: 'series', cat: 'Anime', lang: 'English / Japanese' }, // Arcane
  { id: 13916, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Death Note
  { id: 114410, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Chainsaw Man
  { id: 31910, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // Naruto Shippuden
  { id: 37854, type: 'series', cat: 'Anime', lang: 'Japanese / Hindi' }, // One Piece
  { id: 129, type: 'movie', cat: 'Anime', lang: 'Japanese' }, // Spirited Away
  { id: 372058, type: 'movie', cat: 'Anime', lang: 'Japanese' }, // Your Name
  { id: 916224, type: 'movie', cat: 'Anime', lang: 'Japanese' } // Suzume
];

async function fetchDetails(item) {
  const endpoint = item.type === 'series' ? 'tv' : 'movie';
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${endpoint}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function build() {
  console.log(`🚀 Building curated catalog with HD banners for ${CURATED_LIST.length} movies/shows...`);
  const results = [];

  for (let i = 0; i < CURATED_LIST.length; i++) {
    const config = CURATED_LIST[i];
    const data = await fetchDetails(config);
    if (!data) {
      console.warn(`⚠️ Skipped ID ${config.id}`);
      continue;
    }

    const title = data.title || data.name || 'Untitled';
    const releaseDate = data.release_date || data.first_air_date || '2024-01-01';
    const releaseYear = parseInt(releaseDate.substring(0, 4), 10) || 2024;
    const genres = (data.genres || []).map(g => g.name);
    if (config.cat && !genres.includes(config.cat)) genres.unshift(config.cat);

    const cast = (data.credits?.cast || []).slice(0, 4).map(c => c.name);
    const director = data.credits?.crew?.find(c => c.job === 'Director')?.name || (data.created_by?.[0]?.name || 'Acclaimed Creator');

    const posterPath = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : 'https://image.tmdb.org/t/p/w780/oiIPU4lvnI0Ag2K9cyAi44eCaoE.jpg';
    const backdropPath = data.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` 
      : (data.poster_path ? `https://image.tmdb.org/t/p/w1280${data.poster_path}` : posterPath);

    const sampleVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

    results.push({
      _id: String(data.id),
      id: String(data.id),
      tmdbId: data.id,
      title,
      slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${data.id}`,
      description: config.customDesc || data.overview || 'Stream this blockbuster title in 1080p Full HD with multi-audio and subtitle support on CineVault.',
      posterUrl: posterPath,
      backdropUrl: backdropPath,
      trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' trailer')}`,
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

    console.log(`[${i + 1}/${CURATED_LIST.length}] ✅ Enriched with HD Banner: ${title} (${releaseYear})`);
  }

  const content = `import type { Movie } from '../types/movie';\n\nexport const CURATED_MOVIES_CATALOG: Movie[] = ${JSON.stringify(results, null, 2)};\n`;
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`💾 Saved ${results.length} movies with verified HD TMDB banners to ${outputPath}`);
}

build().catch(console.error);
