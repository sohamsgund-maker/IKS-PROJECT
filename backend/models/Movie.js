import mongoose from 'mongoose';

const qualitySchema = new mongoose.Schema({
  quality: { type: String, required: true }, // '480p', '720p', '1080p', '4K'
  videoUrl: { type: String, required: true },
  downloadUrl: { type: String, default: '' },
  fileSize: { type: String, default: '' }
}, { _id: false });

const subtitleSchema = new mongoose.Schema({
  language: { type: String, required: true },
  src: { type: String, required: true },
  label: { type: String, required: true }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  posterUrl: { type: String, required: true },
  backdropUrl: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  releaseYear: { type: Number, required: true },
  language: { type: String, default: 'English' },
  genres: [{ type: String, required: true }],
  duration: { type: String, default: '2h 00m' },
  rating: { type: Number, default: 8.0, min: 0, max: 10 },
  director: { type: String, default: '' },
  cast: [{ type: String }],
  type: { type: String, enum: ['movie', 'series'], default: 'movie' },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  qualities: [qualitySchema],
  videoUrl: { type: String, required: true },
  downloadUrl: { type: String, default: '' },
  subtitles: [subtitleSchema]
}, { timestamps: true });

export default mongoose.model('Movie', movieSchema);
