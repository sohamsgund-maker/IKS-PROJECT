import { ApiError } from '../utils/apiError.js';

export const validateSearchQuery = (req, res, next) => {
  const { q, page, limit } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return next(ApiError.badRequest('Query parameter "q" is required'));
  }

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return next(ApiError.badRequest('Parameter "page" must be a positive integer'));
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return next(ApiError.badRequest('Parameter "limit" must be between 1 and 100'));
  }

  next();
};

export const validateMovieId = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    return next(ApiError.badRequest('Movie ID must be a valid positive integer'));
  }
  next();
};
