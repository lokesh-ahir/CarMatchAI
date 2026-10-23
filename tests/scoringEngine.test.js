import { describe, it, expect } from 'vitest';
import { scoreAndRank } from '../scoringEngine.js';

describe('scoringEngine - scoreAndRank', () => {
  const mockDataset = [
    { brand: 'Hyundai', model: 'Creta', exShowroomPrice: 1200000, fuelType: 'Petrol' },
    { brand: 'Tata', model: 'Nexon', exShowroomPrice: 900000, fuelType: 'Diesel' },
    { brand: 'Maruti', model: 'Swift', exShowroomPrice: 600000, fuelType: 'Petrol' },
    { brand: 'Hyundai', model: 'Venue', exShowroomPrice: 850000, fuelType: 'Petrol' }
  ];

  it('should rank cars higher if they match the exact brand', () => {
    const parsedQuery = { filters: { brand: ['Hyundai'] }, weights: { price: 1, type: 1, brand: 1, fuel: 1 } };
    const rankedCars = scoreAndRank(mockDataset, parsedQuery);

    // Hyundai cars should be at the top
    expect(rankedCars[0].brand).toBe('Hyundai');
    expect(rankedCars[1].brand).toBe('Hyundai');
    expect(rankedCars[2].brand).not.toBe('Hyundai');
  });

  it('should filter out cars above a strict budget max', () => {
    const parsedQuery = { filters: { priceMax: 900000 }, weights: { price: 1, type: 1, brand: 1, fuel: 1 } };
    const rankedCars = scoreAndRank(mockDataset, parsedQuery);

    // Creta (1200000) should have a lower score than cars within budget
    const creta = rankedCars.find(c => c.model === 'Creta');
    const swift = rankedCars.find(c => c.model === 'Swift');
    expect(creta.relevanceScore).toBeLessThan(swift.relevanceScore);
  });

  it('should rank cars higher if they match the fuel type', () => {
    const parsedQuery = { filters: { fuelType: ['Diesel'] }, weights: { price: 1, type: 1, brand: 1, fuelType: 1 } };
    const rankedCars = scoreAndRank(mockDataset, parsedQuery);

    expect(rankedCars[0].brand).toBe('Tata');
    expect(rankedCars[0].fuelType).toBe('Diesel');
  });
});
