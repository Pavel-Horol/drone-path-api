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

// Error & 404 handling middleware
app.use(errorHandler);
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
