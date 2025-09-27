import { Router } from 'express';
import { autoWrapRoutes } from '../middleware/autoWrapRoutes.js';
import {
  validateCreateDrone,
  validateUpdateDrone,
  validateGetDroneById,
  validateDeleteDrone,
  validateAssignDroneToRoute
} from '../middleware/validation.js';
import {
  createDrone,
  getAllDrones,
  getDroneById,
  updateDrone,
  deleteDrone,
  assignDroneToRoute
} from '../controllers/drone.controller.js';
import AuthMiddleware from '../middleware/auth.js';

const router = autoWrapRoutes(Router());

// Public routes (can be accessed with or without authentication)
router.get('/', AuthMiddleware.optionalAuth, getAllDrones);
router.get('/:id', validateGetDroneById, getDroneById);

// Protected routes (require authentication)
router.post('/',
  AuthMiddleware.authenticate,
  validateCreateDrone,
  createDrone
);

router.put('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.checkOwnership('drone'),
  validateUpdateDrone,
  updateDrone
);

router.delete('/:id',
  AuthMiddleware.authenticate,
  AuthMiddleware.checkOwnership('drone'),
  validateDeleteDrone,
  deleteDrone
);

router.post('/:droneId/assign-route/:routeId',
  AuthMiddleware.authenticate,
  validateAssignDroneToRoute,
  assignDroneToRoute
);

export default router;
