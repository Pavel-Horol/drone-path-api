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

const router = autoWrapRoutes(Router());

// POST /drones - Create new drone
router.post('/', validateCreateDrone, createDrone);

// GET /drones - List all drones
router.get('/', getAllDrones);

// GET /drones/:id - Get specific drone details
router.get('/:id', validateGetDroneById, getDroneById);

// PUT /drones/:id - Update drone info
router.put('/:id', validateUpdateDrone, updateDrone);

// DELETE /drones/:id - Delete drone
router.delete('/:id', validateDeleteDrone, deleteDrone);

// POST /drones/:droneId/assign-route/:routeId - Assign drone to route
router.post('/:droneId/assign-route/:routeId', validateAssignDroneToRoute, assignDroneToRoute);

export default router;
