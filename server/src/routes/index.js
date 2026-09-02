import { Router } from 'express';
import movieRoutes from './movie.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/movies', movieRoutes);
router.use('/health', healthRoutes);

export default router;
