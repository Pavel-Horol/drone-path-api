// Advanced Error Handler Middleware
import { AppError } from '../utils/appError.js';

// Utility function to wrap async route handlers and catch errors automatically
export function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// Handle MongoDB/Mongoose errors
const handleMongooseError = (err) => {
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
  }

  if (err.name === 'CastError') {
    return new AppError('Invalid resource ID format', 400);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`${field} already exists: ${err.keyValue[field]}`, 409);
  }

  if (err.name === 'MongoNetworkError') {
    return new AppError('Database connection error', 503);
  }

  return new AppError('Database operation failed', 500);
};

// Handle JWT errors
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return new AppError('Your token has expired. Please log in again.', 401);
  }

  return new AppError('Authentication error', 401);
};

// Handle Multer file upload errors
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size allowed is 5MB.', 400);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files uploaded.', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field.', 400);
  }

  return new AppError('File upload error', 400);
};

// Send error response based on environment
const sendErrorResponse = (err, req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error with request context
  const timestamp = new Date().toISOString();
  const requestId = req.id || req.headers['x-request-id'] || 'unknown';

  console.error(`[${timestamp}] [${requestId}] Error:`, {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Send appropriate response
  if (err.isOperational) {
    // Operational errors (trusted errors)
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      ...(isDevelopment && {
        stack: err.stack,
        error: err
      })
    });
  }

  // Programming errors (untrusted errors) - don't leak details
  return res.status(500).json({
    success: false,
    status: 'error',
    message: isDevelopment ? err.message : 'Something went wrong!',
    ...(isDevelopment && {
      stack: err.stack,
      error: err
    })
  });
};

// Main error handler middleware
export function errorHandler(err, req, res, _next) {
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000 || err.name === 'MongoNetworkError') {
    error = handleMongooseError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  } else if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Default error properties
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  error.isOperational = error.isOperational !== undefined ? error.isOperational : false;

  return sendErrorResponse(error, req, res);
}

// Global unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  console.error('Promise:', promise);

  // In production, you might want to gracefully shutdown the server
  // For now, we'll just log it and continue
  if (process.env.NODE_ENV === 'production') {
    console.error('Shutting down server due to unhandled promise rejection...');
    process.exit(1);
  }
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);

  // Always shutdown on uncaught exceptions
  console.error('Shutting down server due to uncaught exception...');
  process.exit(1);
});
