
import { AppError } from '../utils/appError.js';

// Global async error catcher - wraps all route handlers automatically
export function catchAsync(app) {
  // Override Express route methods to automatically catch async errors
  const originalMethods = {};
  const methods = ['get', 'post', 'put', 'patch', 'delete'];

  methods.forEach(method => {
    originalMethods[method] = app[method];
    app[method] = function(path, ...handlers) {
      const wrappedHandlers = handlers.map(handler => {
        if (handler.constructor.name === 'AsyncFunction') {
          return (req, res, next) => {
            Promise.resolve(handler(req, res, next)).catch(next);
          };
        }
        return handler;
      });
      return originalMethods[method].call(this, path, ...wrappedHandlers);
    };
  });
}

// Error handler middleware
export function errorHandler(err, req, res, _next) {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new AppError(message, 401);
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large. Please upload a smaller file.';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded or unexpected field name.';
    error = new AppError(message, 400);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const status = error.status || 'error';

  // Send error response
  res.status(statusCode).json({
    success: false,
    status,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
