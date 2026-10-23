import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { loadCarDataset } from './dataLoader.js';
import { handleRecommendation } from './recommendController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// IP-based rate limiting: 20 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP, please try again after a minute.' },
});

// Apply rate limiter to API routes
app.use('/api/', apiLimiter);

// Load dataset at startup (exported for use by route handlers)
export let carDataset = [];

const csvPath = path.resolve(__dirname, 'Vehicle_Models_India_15k.csv');
carDataset = loadCarDataset(csvPath);
console.log(`Loaded ${carDataset.length} car records from CSV`);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Car Recommendation API is running' });
});

// Recommendation endpoint
app.post('/api/recommend', handleRecommendation);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
