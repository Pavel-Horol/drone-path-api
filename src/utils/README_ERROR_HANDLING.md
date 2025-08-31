# Advanced Error Handling System

## Overview
Your error handling system has been upgraded to a comprehensive, production-ready solution that automatically catches all errors, prevents app crashes, and provides consistent error responses. Controllers can now simply throw errors without try-catch blocks.

## Key Components

### 1. Zero-Wrapper Automatic Error Catching (`autoWrapRoutes`)
The `autoWrapRoutes()` middleware automatically wraps ALL route handlers to catch async errors without any code changes:
```javascript
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
const router = autoWrapRoutes(Router());

// Your routes work unchanged - errors are caught automatically!
router.post('/', createDrone);
router.get('/:id', getDroneById);
```

### 2. AppError & createError (src/utils/appError.js)
- Custom error class with status codes and operational flags
- Convenient error creators for common scenarios

### 3. Advanced Error Handler (src/middleware/errorHandler.js)
- **Handles specific error types**: Mongoose, JWT, Multer, and custom errors
- **Enhanced logging**: Request context, timestamps, and structured error data
- **Environment-aware responses**: Detailed errors in development, sanitized in production
- **Global error handlers**: Prevents unhandled rejections and exceptions from crashing the app

## Usage Pattern

### Before (Old Pattern with try-catch):
```javascript
export async function createDrone(req, res) {
  try {
    if (!req.body.droneId) {
      return res.status(400).json({ error: 'droneId is required' });
    }

    const drone = await Drone.findOne({ droneId: req.body.droneId });
    if (drone) {
      return res.status(409).json({ error: 'Drone ID already exists' });
    }

    const newDrone = new Drone(req.body);
    await newDrone.save();

    res.status(201).json(newDrone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### After (New Zero-Wrapper Pattern - Just Throw):
```javascript
import { createError } from '../utils/appError.js';

export async function createDrone(req, res) {
  if (!req.body.droneId) {
    throw createError.badRequest('droneId is required');
  }

  const existingDrone = await Drone.findOne({ droneId: req.body.droneId });
  if (existingDrone) {
    throw createError.conflict('Drone ID already exists');
  }

  const newDrone = new Drone(req.body);
  await newDrone.save();

  res.status(201).json(newDrone);
  // Any errors thrown here are automatically caught by autoWrapRoutes!
}
```

### Route Setup (One-time setup per route file):
```javascript
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
const router = autoWrapRoutes(Router());

// All your routes are automatically wrapped - no changes needed!
router.post('/', createDrone);
router.get('/:id', getDroneById);
```

## Error Types Handled Automatically

### Database Errors (Mongoose)
- **ValidationError**: Invalid input data with detailed field messages
- **CastError**: Invalid ID format (e.g., non-ObjectId strings)
- **Duplicate Key (11000)**: Unique constraint violations
- **MongoNetworkError**: Database connection issues

### Authentication Errors (JWT)
- **JsonWebTokenError**: Invalid or malformed tokens
- **TokenExpiredError**: Expired tokens

### File Upload Errors (Multer)
- **LIMIT_FILE_SIZE**: Files exceeding size limits
- **LIMIT_FILE_COUNT**: Too many files uploaded
- **LIMIT_UNEXPECTED_FILE**: Unexpected file fields

## Available Error Creators

```javascript
import { createError } from '../utils/appError.js';

// HTTP Status Errors
createError.badRequest(message)        // 400
createError.unauthorized(message)      // 401
createError.forbidden(message)         // 403
createError.notFound(resource)         // 404
createError.conflict(message)          // 409
createError.validationError(message)   // 400
createError.internalServer(message)    // 500

// Custom Errors
createError.custom(message, statusCode)
```

## Error Response Format

### Operational Errors (Trusted):
```json
{
  "success": false,
  "status": "fail",
  "message": "droneId is required"
}
```

### Programming Errors (Untrusted):
```json
{
  "success": false,
  "status": "error",
  "message": "Something went wrong!"
}
```

### Development Mode (Additional Details):
```json
{
  "success": false,
  "status": "fail",
  "message": "droneId is required",
  "stack": "...",
  "error": { ... }
}
```

## Benefits

1. **Zero Try-Catch Blocks**: Controllers are clean and readable
2. **Crash Prevention**: Global handlers prevent app crashes
3. **Consistent Responses**: All errors follow the same format
4. **Enhanced Logging**: Structured error logs with request context
5. **Automatic Error Classification**: Distinguishes operational vs programming errors
6. **Environment-Aware**: Detailed errors in development, sanitized in production
7. **Type-Specific Handling**: Specialized handling for common error types

## Migration Guide

To migrate existing controllers to the zero-wrapper approach:

### For Route Files (One-time setup):
```javascript
// Add this import and wrapper to each route file
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
const router = autoWrapRoutes(Router()); // Instead of: const router = Router();
```

### For Controller Functions:
1. **Remove try-catch blocks**:
   ```javascript
   // Old
   export async function createDrone(req, res) {
     try {
       // ... logic with manual error handling
     } catch (error) {
       // ... manual error response
     }
   }

   // New - just throw errors!
   export async function createDrone(req, res) {
     if (!req.body.droneId) {
       throw createError.badRequest('droneId is required');
     }
     // ... rest of logic - errors are caught automatically
   }
   ```

2. **Replace manual error responses with throws**:
   ```javascript
   // Old: return res.status(400).json({ error: 'Invalid input' });
   // New: throw createError.badRequest('Invalid input');

   // Old: return res.status(404).json({ error: 'Not found' });
   // New: throw createError.notFound('Resource');
   ```

3. **Remove catchAsync wrappers** (if you were using them):
   ```javascript
   // Old: export const handler = catchAsync(async (req, res) => {
   // New: export async function handler(req, res) {
   ```

### Benefits of Migration:
- **Cleaner Code**: No wrapper functions or try-catch blocks
- **Consistent Errors**: All errors follow the same format automatically
- **Better Maintainability**: Less boilerplate code
- **Automatic Error Handling**: Database, JWT, and upload errors handled automatically

## Global Error Prevention

The system includes global handlers for:
- **Unhandled Promise Rejections**: Catches async errors outside Express routes
- **Uncaught Exceptions**: Prevents crashes from synchronous errors
- **Process Termination**: Graceful shutdown in production environments
