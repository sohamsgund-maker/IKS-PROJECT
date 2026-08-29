import express from 'express';
import { createMovie, updateMovie, deleteMovie } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/movies', protect, adminOnly, createMovie);
router.put('/movies/:id', protect, adminOnly, updateMovie);
router.delete('/movies/:id', protect, adminOnly, deleteMovie);

export default router;
