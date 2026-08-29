import Movie from '../models/Movie.js';

// GET /api/movies (Filtered by type, genre, language, year, sort)
export const getMovies = async (req, res) => {
  try {
    const { type, genre, language, year, sort } = req.query;
    let query = {};
    if (type) query.type = type;
    if (genre && genre !== 'All') query.genres = { $in: [new RegExp(`^${genre}$`, 'i')] };
    if (language && language !== 'All') query.language = new RegExp(language, 'i');
    if (year && year !== 'All') query.releaseYear = parseInt(year);

    let sortOption = { createdAt: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'year') sortOption = { releaseYear: -1 };
    if (sort === 'trending') sortOption = { trending: -1, rating: -1 };

    const movies = await Movie.find(query).sort(sortOption);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/movies/:slug
export const getMovieBySlug = async (req, res) => {
  try {
    const movie = await Movie.findOne({ slug: req.params.slug });
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/movies/trending
export const getTrendingMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ trending: true }).limit(10);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/movies/latest
export const getLatestMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 }).limit(12);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/movies/genre/:genre
export const getMoviesByGenre = async (req, res) => {
  try {
    const movies = await Movie.find({ genres: { $in: [new RegExp(req.params.genre, 'i')] } });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/search?q=keyword
export const searchMovies = async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json([]);
    const regex = new RegExp(q, 'i');
    const movies = await Movie.find({
      $or: [
        { title: regex },
        { genres: { $in: [regex] } },
        { language: regex },
        { cast: { $in: [regex] } },
        { director: regex }
      ]
    });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
