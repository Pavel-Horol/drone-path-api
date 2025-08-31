// Custom Error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error creators for consistent error handling
const createError = {
  notFound: (resource = 'Resource') => new AppError(`${resource} not found`, 404),

  badRequest: (message = 'Bad request') => new AppError(message, 400),

  unauthorized: (message = 'Unauthorized access') => new AppError(message, 401),

  forbidden: (message = 'Access forbidden') => new AppError(message, 403),

  conflict: (message = 'Conflict occurred') => new AppError(message, 409),

  validationError: (message = 'Validation failed') => new AppError(message, 400),

  internalServer: (message = 'Internal server error') => new AppError(message, 500),

  custom: (message, statusCode = 500) => new AppError(message, statusCode)
};

export { AppError, createError };
