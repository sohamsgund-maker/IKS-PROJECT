import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import movieRoutes from './routes/movieRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import scraperRoutes from './routes/scraperRoutes.js';
import movieboxRoutes from './routes/movieboxRoutes.js';
import { initAutoScraperSchedule } from './services/movieScraper.js';
import { initMovieBoxScraperSchedule } from './services/movieboxScraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinevault';

app.use(cors());
app.use(express.json());

// API Endpoints
app.use('/api/movies', movieRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/moviebox', movieboxRoutes);

// Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Database connection & Startup
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB (CineVault DB)');
    app.listen(PORT, () => {
      console.log(`🚀 CineVault Backend running on http://localhost:${PORT}`);
      initAutoScraperSchedule();
      initMovieBoxScraperSchedule();
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Note:', err.message);
    app.listen(PORT, () => {
      console.log(`🚀 CineVault Backend running on http://localhost:${PORT} (Local Fallback)`);
      initAutoScraperSchedule();
      initMovieBoxScraperSchedule();
    });
  });
