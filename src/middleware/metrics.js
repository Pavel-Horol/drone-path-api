import { httpRequestDuration, httpRequestsTotal } from '@/config/monitoring.config.js';

export async function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e9;
    const route = req.route?.path || req.path || 'unknown';
    httpRequestDuration.labels(req.method, route, String(res.statusCode)).observe(duration);
    httpRequestsTotal.labels(req.method, route, String(res.statusCode)).inc();
  });
  next();
}
