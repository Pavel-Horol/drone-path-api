import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
import {
  validateCreateRoute,
  validateUploadRoutePhotos,
  validateGetRouteById,
  validate
} from '../middleware/validation.js';
import {
  createRoute,
  uploadRoutePhotos,
  getRouteById,
  getAllRoutes
} from '../controllers/route.controller.js';
import { createRouteSchema } from '../validations/route.validation.js';

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

// POST /routes - Create new route with CSV and photos
router.post('/', upload.fields([
  { name: 'csv', maxCount: 1 },
  { name: 'photos', maxCount: 1000 }
]), validate(createRouteSchema), createRoute);

// POST /routes/:id/photos - Upload missing photos for existing route
router.post('/:id/photos', upload.array('photos', 1000), validateUploadRoutePhotos, uploadRoutePhotos);

// GET /routes/:id - Get route data for mapping
router.get('/:id', validateGetRouteById, getRouteById);

// GET /routes - List all routes
router.get('/', getAllRoutes);

export default router;
