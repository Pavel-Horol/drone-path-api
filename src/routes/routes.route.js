import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
import {
  createRoute,
  uploadRoutePhotos,
  getRouteById,
  getAllRoutes
} from '../controllers/route.controller.js';

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
]), createRoute);

// POST /routes/:id/photos - Upload missing photos for existing route
router.post('/:id/photos', upload.array('photos', 1000), uploadRoutePhotos);

// GET /routes/:id - Get route data for mapping
router.get('/:id', getRouteById);

// GET /routes - List all routes
router.get('/', getAllRoutes);

export default router;
