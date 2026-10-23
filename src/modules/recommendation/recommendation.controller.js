import { parseQuery, generateReasons } from './ai.service.js';
import { scoreAndRank } from './scoring.engine.js';
import { carDataset } from '../../server.js';
import NodeCache from 'node-cache';

// Cache AI responses for 1 hour to improve performance and reduce API costs
const responseCache = new NodeCache({ stdTTL: 3600 });

/**
 * Handles POST /api/recommend requests.
 * Orchestrates: validate → parse query → score cars → generate reasons → respond.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function handleRecommendation(req, res) {
  const { query } = req.body;

  // Validate that query exists, is a string, and is non-empty after trimming
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      error: 'Missing or empty "query" field in request body.',
    });
  }

  // Pre-AI Guardrail: Check query length to prevent abuse or prompt injection attempts
  if (query.length > 500) {
    return res.status(400).json({
      error: 'Query is too long. Please keep your request under 500 characters.',
    });
  }

  try {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      return res.json({ recommendations: cachedResponse });
    }

    // Step 1: Parse the natural language query into structured filters and weights
    const parsedQuery = await parseQuery(query);

    // Step 2: Score and rank cars against parsed criteria
    const topCars = scoreAndRank(carDataset, parsedQuery);

    // Step 3: Generate AI suitability reasons (graceful degradation on failure)
    let reasons;
    try {
      reasons = await generateReasons(query, topCars);
    } catch {
      // If reason generation fails, use empty strings as fallback
      reasons = topCars.map(() => '');
    }

    // Step 4: Format and return the response
    const recommendations = topCars.map((car, index) => ({
      brand: car.brand,
      model: car.model,
      launchYear: car.launchYear,
      segment: car.segment,
      fuelType: car.fuelType,
      exShowroomPrice: car.exShowroomPrice,
      notableFeatures: car.notableFeatures,
      relevanceScore: car.relevanceScore,
      suitabilityReason: reasons[index] || '',
    }));

    // Store in cache
    responseCache.set(cacheKey, recommendations);

    return res.json({ recommendations });
  } catch (error) {
    if (error.message === 'IRRELEVANT_QUERY') {
      return res.status(400).json({
        error: 'I can only help with car recommendations. Please ask about finding, buying, or comparing cars.',
      });
    }
    // If Gemini query parsing fails, return 503
    return res.status(503).json({
      error: 'Service temporarily unavailable. Please try again later.',
    });
  }
}
