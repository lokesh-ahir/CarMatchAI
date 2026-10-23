import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import recommendationRoutes from './modules/recommendation/recommendation.routes.js';

const app = express();

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

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'CarMatch AI API is running' });
});

// Mount modular routes
app.use('/api', recommendationRoutes);

export default app;
