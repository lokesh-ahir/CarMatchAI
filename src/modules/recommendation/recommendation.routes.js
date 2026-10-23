import express from 'express';
import { handleRecommendation } from './recommendation.controller.js';

const router = express.Router();

// POST /api/recommend
router.post('/recommend', handleRecommendation);

export default router;
