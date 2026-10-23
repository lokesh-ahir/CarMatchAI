/**
 * Scoring Engine - Evaluates cars against parsed query criteria and returns top 5 matches.
 * Each dimension scorer returns a value between 0 and 1.
 * The final relevance score is normalized to 0-100.
 */

/**
 * Scores a car on the price dimension.
 * Returns 1.0 if the car's price falls within [priceMin, priceMax].
 * Uses proximity-based decay for partial matching when outside range.
 * Returns 1.0 if no price filters are specified (no preference).
 * Supports both single-price (number) and range-price ({ min, max }) cars.
 * @param {object} car - CarRecord object
 * @param {object} filters - Parsed filters
 * @returns {number} Score between 0 and 1
 */
export function scorePriceDimension(car, filters) {
  const { priceMin, priceMax } = filters;

  // No price preference means full score
  if (priceMin == null && priceMax == null) {
    return 1.0;
  }

  const priceValue = car.exShowroomPrice;

  // Range-aware scoring for cars with { min, max } price
  if (typeof priceValue === 'object' && priceValue !== null && 'min' in priceValue && 'max' in priceValue) {
    return scoreRangePrice(priceValue, priceMin, priceMax);
  }

  // --- Single price path (UNCHANGED) ---
  const price = priceValue;

  // Only min specified
  if (priceMin != null && priceMax == null) {
    if (price >= priceMin) return 1.0;
    // Decay based on how far below the min
    const distance = priceMin - price;
    const decay = Math.max(0, 1 - distance / priceMin);
    return decay;
  }

  // Only max specified
  if (priceMin == null && priceMax != null) {
    if (price <= priceMax) return 1.0;
    // Decay based on how far above the max
    const distance = price - priceMax;
    const decay = Math.max(0, 1 - distance / priceMax);
    return decay;
  }

  // Both min and max specified
  if (price >= priceMin && price <= priceMax) {
    return 1.0;
  }

  // Outside range - use proximity decay
  const range = priceMax - priceMin;
  const tolerance = range > 0 ? range : priceMax;

  if (price < priceMin) {
    const distance = priceMin - price;
    return Math.max(0, 1 - distance / tolerance);
  }

  // price > priceMax
  const distance = price - priceMax;
  return Math.max(0, 1 - distance / tolerance);
}

/**
 * Range-aware scoring for cars with price ranges ({ min, max }).
 * Returns 1.0 if any part of the car's [min, max] overlaps with user's budget range.
 * Applies proximity-based decay if no overlap, based on shortest distance between ranges.
 * @param {{ min: number, max: number }} carPrice - Car's price range
 * @param {number|null} priceMin - User's minimum budget filter
 * @param {number|null} priceMax - User's maximum budget filter
 * @returns {number} Score between 0 and 1
 */
function scoreRangePrice(carPrice, priceMin, priceMax) {
  const carMin = carPrice.min;
  const carMax = carPrice.max;

  // Only priceMin specified: overlap exists if car's max >= priceMin
  if (priceMin != null && priceMax == null) {
    if (carMax >= priceMin) return 1.0;
    // No overlap: car's entire range is below priceMin
    const distance = priceMin - carMax;
    return Math.max(0, 1 - distance / priceMin);
  }

  // Only priceMax specified: overlap exists if car's min <= priceMax
  if (priceMin == null && priceMax != null) {
    if (carMin <= priceMax) return 1.0;
    // No overlap: car's entire range is above priceMax
    const distance = carMin - priceMax;
    return Math.max(0, 1 - distance / priceMax);
  }

  // Both specified: overlap exists if car.min <= priceMax AND car.max >= priceMin
  if (carMin <= priceMax && carMax >= priceMin) {
    return 1.0;
  }

  // No overlap - compute shortest distance between the two ranges
  const budgetRange = priceMax - priceMin;
  const tolerance = budgetRange > 0 ? budgetRange : priceMax;

  if (carMax < priceMin) {
    // Car's range is entirely below user's budget
    const distance = priceMin - carMax;
    return Math.max(0, 1 - distance / tolerance);
  }

  // Car's range is entirely above user's budget (carMin > priceMax)
  const distance = carMin - priceMax;
  return Math.max(0, 1 - distance / tolerance);
}

/**
 * Scores a car on the segment dimension.
 * Returns 1.0 if car's segment matches any in the filter list.
 * Returns 0.0 if no match. Returns 1.0 if filter is empty (no preference).
 * @param {object} car - CarRecord object
 * @param {object} filters - Parsed filters
 * @returns {number} Score between 0 and 1
 */
function scoreSegmentDimension(car, filters) {
  const { segment } = filters;

  if (!segment || segment.length === 0) {
    return 1.0;
  }

  const carSegment = car.segment.toLowerCase();
  const match = segment.some(s => s.toLowerCase() === carSegment);
  return match ? 1.0 : 0.0;
}

/**
 * Scores a car on the fuel type dimension.
 * Returns 1.0 if car's fuel type matches any in the filter list.
 * Returns 0.0 if no match. Returns 1.0 if filter is empty (no preference).
 * @param {object} car - CarRecord object
 * @param {object} filters - Parsed filters
 * @returns {number} Score between 0 and 1
 */
function scoreFuelDimension(car, filters) {
  const { fuelType } = filters;

  if (!fuelType || fuelType.length === 0) {
    return 1.0;
  }

  const carFuel = car.fuelType.toLowerCase();
  const match = fuelType.some(f => f.toLowerCase() === carFuel);
  return match ? 1.0 : 0.0;
}

/**
 * Scores a car on the brand dimension.
 * Returns 1.0 if car's brand matches any in the filter list.
 * Returns 0.0 if no match. Returns 1.0 if filter is empty (no preference).
 * @param {object} car - CarRecord object
 * @param {object} filters - Parsed filters
 * @returns {number} Score between 0 and 1
 */
function scoreBrandDimension(car, filters) {
  const { brand } = filters;

  if (!brand || brand.length === 0) {
    return 1.0;
  }

  const carBrand = car.brand.toLowerCase();
  const match = brand.some(b => b.toLowerCase() === carBrand);
  return match ? 1.0 : 0.0;
}

/**
 * Scores a car on the features dimension.
 * Computes a ratio of matched features to requested features.
 * Returns 1.0 if filter is empty (no preference).
 * @param {object} car - CarRecord object
 * @param {object} filters - Parsed filters
 * @returns {number} Score between 0 and 1
 */
function scoreFeaturesDimension(car, filters) {
  const { features } = filters;

  if (!features || features.length === 0) {
    return 1.0;
  }

  const carFeatures = (car.notableFeatures || '').toLowerCase();

  if (!carFeatures) {
    return 0.0;
  }

  let matchCount = 0;
  for (const feature of features) {
    if (carFeatures.includes(feature.toLowerCase())) {
      matchCount++;
    }
  }

  return matchCount / features.length;
}

/**
 * Scores a car on the EV dimension.
 * Returns 1.0 if car's EV status matches the preference.
 * Returns 0.0 if mismatch. Returns 1.0 if no EV preference (null).
 * @param {object} car - CarRecord object
 * @param {object} filters - Parsed filters
 * @returns {number} Score between 0 and 1
 */
function scoreEVDimension(car, filters) {
  const { isEV } = filters;

  if (isEV == null) {
    return 1.0;
  }

  return car.isEV === isEV ? 1.0 : 0.0;
}

/**
 * Computes a weighted relevance score for a single car.
 * Each dimension is scored 0-1 then multiplied by its dynamic weight.
 * The final score is normalized to 0-100.
 * @param {object} car - CarRecord object
 * @param {object} filters - Extracted filter criteria
 * @param {object} weights - Dynamic scoring weights (each 0.0-1.0)
 * @returns {number} Integer score between 0 and 100
 */
function computeScore(car, filters, weights) {
  let score = 0;
  let totalWeight = 0;

  if (weights.price > 0) {
    score += weights.price * scorePriceDimension(car, filters);
    totalWeight += weights.price;
  }
  if (weights.segment > 0) {
    score += weights.segment * scoreSegmentDimension(car, filters);
    totalWeight += weights.segment;
  }
  if (weights.fuelType > 0) {
    score += weights.fuelType * scoreFuelDimension(car, filters);
    totalWeight += weights.fuelType;
  }
  if (weights.brand > 0) {
    score += weights.brand * scoreBrandDimension(car, filters);
    totalWeight += weights.brand;
  }
  if (weights.features > 0) {
    score += weights.features * scoreFeaturesDimension(car, filters);
    totalWeight += weights.features;
  }
  if (weights.ev > 0) {
    score += weights.ev * scoreEVDimension(car, filters);
    totalWeight += weights.ev;
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
}

/**
 * Scores all cars in the dataset against parsed query criteria.
 * Returns the top 5 cars sorted by relevance score in descending order.
 * Partial matching ensures results are always returned even without exact matches.
 * @param {Array} dataset - Full car dataset (array of CarRecord objects)
 * @param {object} parsedQuery - Object with filters and weights from query parser
 * @returns {Array} Top 5 ScoredCar objects with relevanceScore field
 */
export function scoreAndRank(dataset, parsedQuery) {
  const { filters, weights } = parsedQuery;

  const scored = dataset.map(car => ({
    ...car,
    relevanceScore: computeScore(car, filters, weights),
  }));

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, 5);
}
