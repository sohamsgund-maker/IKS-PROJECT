import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from '../models/Movie.js';

dotenv.config();

export const sampleMovies = [
  {
    title: 'Tears of Steel',
    slug: 'tears-of-steel',
    description: 'Set in a dystopian future Amsterdam, a group of warriors desperately try to stage a key moment from their past in a remote rocket launch silo to save earth from destructive robotic behemoths.',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8',
    releaseYear: 2024,
    language: 'English',
    genres: ['Sci-Fi', 'Action'],
    duration: '12m',
    rating: 8.5,
    director: 'Ian Hubert',
    cast: ['Derek de Lint', 'Vanja Rukavina', 'Denise Rebergen'],
    type: 'movie',
    featured: true,
    trending: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    qualities: [
      { quality: '480p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', fileSize: '180 MB' },
      { quality: '720p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', fileSize: '320 MB' },
      { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', fileSize: '480 MB' }
    ]
  },
  {
    title: 'Big Buck Bunny',
    slug: 'big-buck-bunny',
    description: 'A gentle giant rabbit awakens to a sunny morning in the forest, only to have his peaceful bliss disrupted by bully forest rodents. It is time for sweet revenge.',
    posterUrl: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: '',
    releaseYear: 2024,
    language: 'English',
    genres: ['Animation', 'Comedy'],
    duration: '10m',
    rating: 8.8,
    director: 'Sacha Goedegebure',
    cast: ['Bunny', 'Frank', 'Rinky'],
    type: 'movie',
    featured: false,
    trending: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    qualities: [
      { quality: '720p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', fileSize: '220 MB' },
      { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', fileSize: '320 MB' }
    ]
  },
  {
    title: 'Sintel: The Dragon Quest',
    slug: 'sintel',
    description: 'A lonely warrior rescues a wounded baby dragon, only for an adult dragon to kidnap it. Sintel embarks on an arduous quest across snow-swept mountains to rescue her companion.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: '',
    releaseYear: 2023,
    language: 'English',
    genres: ['Animation', 'Fantasy', 'Adventure'],
    duration: '15m',
    rating: 8.7,
    director: 'Colin Levy',
    cast: ['Halina Reijn', 'Thom Hoffman'],
    type: 'movie',
    featured: true,
    trending: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    qualities: [
      { quality: '720p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', fileSize: '280 MB' },
      { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', fileSize: '410 MB' }
    ]
  },
  {
    title: 'Cyber Chronicles: Syndicate',
    slug: 'cyber-chronicles',
    description: 'A multi-part web series following an underground squad of netrunners exploring high-tech conspiracies across a neon-lit metropolis.',
    posterUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: '',
    releaseYear: 2024,
    language: 'English',
    genres: ['Sci-Fi', 'Action', 'Drama'],
    duration: '1 Season',
    rating: 9.1,
    director: 'Elena Vance',
    cast: ['Marcus Cole', 'Sarah Connor', 'Jayce Talis'],
    type: 'series',
    featured: false,
    trending: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    qualities: [
      { quality: '720p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', fileSize: '520 MB' },
      { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', fileSize: '850 MB' }
    ]
  },
  {
    title: 'Elephants Dream',
    slug: 'elephants-dream',
    description: 'Proog and Emo explore a giant, surreal, and sinister organic machine. While Proog embraces the machine, young Emo tries to rebel against its reality.',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: '',
    releaseYear: 2023,
    language: 'English',
    genres: ['Animation', 'Sci-Fi', 'Fantasy'],
    duration: '11m',
    rating: 8.0,
    director: 'Bassam Kurdali',
    cast: ['Tygo Gernandt', 'Cas Jansen'],
    type: 'movie',
    featured: false,
    trending: false,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    qualities: [
      { quality: '720p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', fileSize: '210 MB' },
      { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', fileSize: '390 MB' }
    ]
  },
  {
    title: 'Shadows of the Realm',
    slug: 'shadows-of-the-realm',
    description: 'An investigative reporter unravels an empire of deceit in high political spheres while uncovering deep state secrets.',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    trailerUrl: '',
    releaseYear: 2024,
    language: 'English',
    genres: ['Drama', 'Thriller'],
    duration: '2 Seasons',
    rating: 8.9,
    director: 'James McAvoy',
    cast: ['Christian Bale', 'Cillian Murphy'],
    type: 'series',
    featured: false,
    trending: true,
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    qualities: [
      { quality: '1080p', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', downloadUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', fileSize: '980 MB' }
    ]
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinevault');
    console.log('Connected to MongoDB for seeding...');
    await Movie.deleteMany({});
    await Movie.insertMany(sampleMovies);
    console.log('✅ CineVault Sample Movies Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

// Execute if run directly
if (process.argv[1]?.endsWith('seedData.js')) {
  seedDB();
}
