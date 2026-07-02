import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

/**
 * Loads and parses the vehicle CSV file into an array of CarRecord objects.
 * Logs error and terminates process if file is missing or unreadable.
 * @param {string} filePath - Path to the CSV file
 * @returns {CarRecord[]} Array of parsed car records
 */
export function loadCarDataset(filePath) {
  try {
    const csvContent = readFileSync(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records.map(normalizeRecord);
  } catch (error) {
    console.error(`Failed to load CSV dataset: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Parses a price field value from the CSV.
 * Detects price range strings (e.g., "6.00 - 15.00") and returns { min, max }.
 * For single numeric values (e.g., "8.50"), returns the parsed float directly.
 * @param {string} input - Raw price field string from CSV
 * @returns {number | { min: number, max: number }} Parsed price value
 */
export function parsePriceField(input) {
  const rangePattern = /^\d+(\.\d+)?\s*-\s*\d+(\.\d+)?$/;
  if (rangePattern.test(input)) {
    const parts = input.split(/\s*-\s*/);
    return { min: parseFloat(parts[0]), max: parseFloat(parts[1]) };
  }
  return parseFloat(input);
}

/**
 * Normalizes a raw CSV row into a structured CarRecord object.
 * Converts numeric fields and boolean flags to proper types.
 * @param {Object} row - Raw CSV row with string values
 * @returns {CarRecord} Normalized car record
 */
export function normalizeRecord(row) {
  return {
    brand: row['Brand'],
    model: row['Model'],
    launchYear: parseInt(row['Launch Year'], 10),
    segment: row['Segment'],
    fuelType: row['Fuel Type'],
    variants: parseInt(row['Variants'], 10),
    exShowroomPrice: parsePriceField(row['Ex-Showroom Price (₹ Lakhs)']),
    monthlySales: parseInt(row['Monthly Sales (Units)'], 10),
    isEV: row['Is EV?'] === 'Yes' || row['Is EV?'] === 'TRUE',
    batteryMileage: row['Battery / Mileage'],
    notableFeatures: row['Notable Features'],
  };
}
