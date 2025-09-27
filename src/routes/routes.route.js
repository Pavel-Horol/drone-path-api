import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
import {
  validateCreateRoute,
  validateUploadRoutePhotos,
  validateGetRouteById
} from '../middleware/validation.js';
import {
  createRoute,
  uploadRoutePhotos,
  getRouteById,
  getAllRoutes
} from '../controllers/route.controller.js';
import AuthMiddleware from '../middleware/auth.js';

const router = autoWrapRoutes(Router());

// Configure multer for file uploads
const storage = memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1000
  }
});

// Public routes (can be accessed with or without authentication)
router.get('/', AuthMiddleware.optionalAuth, getAllRoutes);
router.get('/:id', validateGetRouteById, getRouteById);

// Protected routes (require authentication)
router.post('/',
  AuthMiddleware.authenticate,
  upload.fields([
    { name: 'csv', maxCount: 1 },
    { name: 'photos', maxCount: 1000 }
  ]),
  validateCreateRoute,
  createRoute
);

router.post('/:id/photos',
  AuthMiddleware.authenticate,
  AuthMiddleware.checkOwnership('route'),
  upload.array('photos', 1000),
  validateUploadRoutePhotos,
  uploadRoutePhotos
);

export default router;
