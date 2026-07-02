import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Builds the prompt that instructs Gemini to parse a user query
 * into structured filters and scoring weights.
 * @param {string} query - User's natural language query
 * @returns {string} The formatted prompt
 */
function buildParsingPrompt(query) {
  return `You are a car recommendation assistant. Parse the following user query into structured filters and scoring weights.

Return ONLY valid JSON with this exact structure:
{
  "filters": {
    "brand": [],          // array of brand names, empty if not mentioned
    "segment": [],        // e.g., ["SUV", "Sedan"]
    "fuelType": [],       // e.g., ["Diesel", "Petrol"]
    "priceMin": null,     // number in Lakhs or null
    "priceMax": null,     // number in Lakhs or null
    "isEV": null,         // true, false, or null
    "features": []        // keywords like ["safety", "sunroof"]
  },
  "weights": {
    "price": 0.0,         // 0.0-1.0 importance weight
    "segment": 0.0,
    "fuelType": 0.0,
    "brand": 0.0,
    "features": 0.0,
    "ev": 0.0
  }
}

User query: "${query}"`;
}

/**
 * Validates and extracts a ParsedQuery from a raw Gemini response string.
 * Strips markdown code fences if present and validates weight bounds.
 * @param {string} responseText - Raw response text from Gemini
 * @returns {ParsedQuery} Validated parsed query object
 */
function validateAndExtractParsedQuery(responseText) {
  // Strip markdown code fences if present
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith('```')) {
    // Remove opening fence (with optional language identifier)
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing fence
    jsonStr = jsonStr.replace(/\n?```\s*$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (error) {
    throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
  }

  // Validate top-level structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Gemini response is not a valid object');
  }
  if (!parsed.filters || typeof parsed.filters !== 'object') {
    throw new Error('Gemini response missing "filters" object');
  }
  if (!parsed.weights || typeof parsed.weights !== 'object') {
    throw new Error('Gemini response missing "weights" object');
  }

  // Normalize filters
  const filters = {
    brand: Array.isArray(parsed.filters.brand) ? parsed.filters.brand : [],
    segment: Array.isArray(parsed.filters.segment) ? parsed.filters.segment : [],
    fuelType: Array.isArray(parsed.filters.fuelType) ? parsed.filters.fuelType : [],
    priceMin: typeof parsed.filters.priceMin === 'number' ? parsed.filters.priceMin : null,
    priceMax: typeof parsed.filters.priceMax === 'number' ? parsed.filters.priceMax : null,
    isEV: typeof parsed.filters.isEV === 'boolean' ? parsed.filters.isEV : null,
    features: Array.isArray(parsed.filters.features) ? parsed.filters.features : [],
  };

  // Validate and clamp weights to 0.0-1.0
  const weightKeys = ['price', 'segment', 'fuelType', 'brand', 'features', 'ev'];
  const weights = {};

  for (const key of weightKeys) {
    let value = parseFloat(parsed.weights[key]);
    if (isNaN(value)) {
      value = 0.0;
    }
    // Clamp to valid range
    weights[key] = Math.max(0.0, Math.min(1.0, value));
  }

  // Ensure at least one weight is greater than 0
  const hasPositiveWeight = weightKeys.some(key => weights[key] > 0);
  if (!hasPositiveWeight) {
    // Default: set price weight to 0.5 as a reasonable fallback
    weights.price = 0.5;
  }

  return { filters, weights };
}

/**
 * Builds the prompt for generating suitability reasons for top cars.
 * @param {string} query - Original user query
 * @param {Array} cars - Top scored cars
 * @returns {string} The formatted prompt
 */
function buildReasonsPrompt(query, cars) {
  const carList = cars
    .map(
      (car, i) =>
        `${i + 1}. ${car.brand} ${car.model} (${car.segment}, ${car.fuelType}, ₹${car.exShowroomPrice} Lakhs, Features: ${car.notableFeatures || 'N/A'})`
    )
    .join('\n');

  return `You are a car recommendation assistant. A user asked: "${query}"

Based on their preferences, here are the top recommended cars:
${carList}

For each car, write a brief suitability reason (1-2 sentences) explaining how it matches the user's specific preferences mentioned in their query. Tailor each reason to the user's needs.

Return ONLY a valid JSON array of strings, one reason per car in the same order:
["reason for car 1", "reason for car 2", ...]`;
}

/**
 * Extracts reason strings from the Gemini response for reason generation.
 * @param {string} responseText - Raw response text from Gemini
 * @param {number} carCount - Number of cars to expect reasons for
 * @returns {string[]} Array of reason strings
 */
function extractReasons(responseText, carCount) {
  let jsonStr = responseText.trim();

  // Strip markdown code fences if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '');
    jsonStr = jsonStr.replace(/\n?```\s*$/, '');
  }

  let reasons;
  try {
    reasons = JSON.parse(jsonStr);
  } catch {
    // If parsing fails, return empty reasons
    return Array(carCount).fill('');
  }

  if (!Array.isArray(reasons)) {
    return Array(carCount).fill('');
  }

  // Ensure we have the right number of reasons, padding with empty strings if needed
  const result = [];
  for (let i = 0; i < carCount; i++) {
    result.push(typeof reasons[i] === 'string' ? reasons[i] : '');
  }

  return result;
}

/**
 * Parses a natural language car query into structured filters and weights
 * using Google Gemini AI.
 * @param {string} query - User's natural language query
 * @returns {Promise<ParsedQuery>} Structured filters and scoring weights
 * @throws {Error} Descriptive error if Gemini API call fails
 */
export async function parseQuery(query) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Service temporarily unavailable.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = buildParsingPrompt(query);

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (error) {
    throw new Error(
      `Failed to communicate with Gemini API: ${error.message || 'Unknown error'}. Service temporarily unavailable.`
    );
  }

  const responseText = result.response.text();
  return validateAndExtractParsedQuery(responseText);
}

/**
 * Generates suitability reasons for the top cars based on user query
 * using Google Gemini AI.
 * @param {string} query - Original user query
 * @param {Array} cars - Top scored cars (up to 5)
 * @returns {Promise<string[]>} Array of reason strings, one per car
 * @throws {Error} Descriptive error if Gemini API call fails
 */
export async function generateReasons(query, cars) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Service temporarily unavailable.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = buildReasonsPrompt(query, cars);

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (error) {
    throw new Error(
      `Failed to generate reasons from Gemini API: ${error.message || 'Unknown error'}. Service temporarily unavailable.`
    );
  }

  const responseText = result.response.text();
  return extractReasons(responseText, cars.length);
}
