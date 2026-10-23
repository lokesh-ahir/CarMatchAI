import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';
import { loadCarDataset } from './core/dataLoader.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Exported dataset for use by modules
export let carDataset = [];

const csvPath = path.resolve(__dirname, '../data/Vehicle_Models_India_15k.csv');
carDataset = loadCarDataset(csvPath);
console.log(`Loaded ${carDataset.length} car records from CSV`);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
