import express, { json } from 'express';
import cors from 'cors';
import { metricsMiddleware } from './middleware/metrics.js';
import router from './routes/index.js';
import { register } from './config/monitoring.config.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(json());
app.use(metricsMiddleware);

// Routes
app.use('/api', router);

app.use('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/metrics', async(req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// 404 handling middleware (must come before error handler)
app.use('*', (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`);
  err.statusCode = 404;
  next(err);
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
