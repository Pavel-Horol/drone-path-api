import { Router } from 'express';
import Drone from '../models/drone.model.js';
import Route from '../models/route.model.js';

const router = Router();

// POST /drones - Create new drone
router.post('/', async(req, res) => {
  try {
    const { droneId, model, serialNumber, currentBatteryCharge, totalFlightTime } = req.body;

    // Validate required fields
    if (!droneId || !model || !serialNumber) {
      return res.status(400).json({
        error: 'droneId, model, and serialNumber are required'
      });
    }

    const drone = new Drone({
      droneId,
      model,
      serialNumber,
      currentBatteryCharge: currentBatteryCharge || 100,
      totalFlightTime: totalFlightTime || 0
    });

    await drone.save();

    res.status(201).json({
      id: drone._id,
      droneId: drone.droneId,
      model: drone.model,
      serialNumber: drone.serialNumber,
      currentBatteryCharge: drone.currentBatteryCharge,
      totalFlightTime: drone.totalFlightTime,
      createdAt: drone.createdAt
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        error: `${field} already exists: ${error.keyValue[field]}`
      });
    }
    console.error('Drone creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drones - List all drones
router.get('/', async(req, res) => {
  try {
    const drones = await Drone.find({}, {
      droneId: 1,
      model: 1,
      serialNumber: 1,
      currentBatteryCharge: 1,
      totalFlightTime: 1,
      createdAt: 1,
      updatedAt: 1
    }).sort({ createdAt: -1 });

    res.json(drones);
  } catch (error) {
    console.error('Drones listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drones/:id - Get specific drone details
router.get('/:id', async(req, res) => {
  try {
    const drone = await Drone.findOne({
      $or: [
        { _id: req.params.id },
        { droneId: req.params.id }
      ]
    });

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    // Get routes flown by this drone
    const routes = await Route.find({ droneId: drone.droneId }, {
      name: 1,
      status: 1,
      totalPoints: 1,
      pointsWithPhotos: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    res.json({
      id: drone._id,
      droneId: drone.droneId,
      model: drone.model,
      serialNumber: drone.serialNumber,
      currentBatteryCharge: drone.currentBatteryCharge,
      totalFlightTime: drone.totalFlightTime,
      createdAt: drone.createdAt,
      updatedAt: drone.updatedAt,
      routes: routes
    });

  } catch (error) {
    console.error('Drone retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /drones/:id - Update drone info
router.put('/:id', async(req, res) => {
  try {
    const { model, currentBatteryCharge, totalFlightTime } = req.body;

    const updateData = {};
    if (model !== undefined) updateData.model = model;
    if (currentBatteryCharge !== undefined) {
      if (currentBatteryCharge < 0 || currentBatteryCharge > 100) {
        return res.status(400).json({
          error: 'currentBatteryCharge must be between 0 and 100'
        });
      }
      updateData.currentBatteryCharge = currentBatteryCharge;
    }
    if (totalFlightTime !== undefined) {
      if (totalFlightTime < 0) {
        return res.status(400).json({
          error: 'totalFlightTime cannot be negative'
        });
      }
      updateData.totalFlightTime = totalFlightTime;
    }

    const drone = await Drone.findOneAndUpdate(
      {
        $or: [
          { _id: req.params.id },
          { droneId: req.params.id }
        ]
      },
      updateData,
      { new: true }
    );

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    res.json({
      id: drone._id,
      droneId: drone.droneId,
      model: drone.model,
      serialNumber: drone.serialNumber,
      currentBatteryCharge: drone.currentBatteryCharge,
      totalFlightTime: drone.totalFlightTime,
      updatedAt: drone.updatedAt
    });

  } catch (error) {
    console.error('Drone update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /drones/:id - Delete drone
router.delete('/:id', async(req, res) => {
  try {
    // Check if drone has associated routes
    const drone = await Drone.findOne({
      $or: [
        { _id: req.params.id },
        { droneId: req.params.id }
      ]
    });

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    const routeCount = await Route.countDocuments({ droneId: drone.droneId });

    if (routeCount > 0) {
      return res.status(400).json({
        error: `Cannot delete drone. It has ${routeCount} associated routes. Delete routes first.`
      });
    }

    await Drone.findByIdAndDelete(drone._id);

    res.json({
      message: 'Drone deleted successfully',
      deletedDrone: {
        id: drone._id,
        droneId: drone.droneId,
        model: drone.model,
        serialNumber: drone.serialNumber
      }
    });

  } catch (error) {
    console.error('Drone deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drones/:droneId/assign-route/:routeId - Assign drone to route
router.post('/:droneId/assign-route/:routeId', async(req, res) => {
  try {
    // Check if drone exists
    const drone = await Drone.findOne({
      $or: [
        { _id: req.params.droneId },
        { droneId: req.params.droneId }
      ]
    });

    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    // Check if route exists
    const route = await Route.findById(req.params.routeId);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Update route with drone assignment
    route.droneId = drone.droneId;
    await route.save();

    res.json({
      message: 'Drone assigned to route successfully',
      route: {
        id: route._id,
        name: route.name,
        droneId: route.droneId,
        status: route.status,
        totalPoints: route.totalPoints,
        pointsWithPhotos: route.pointsWithPhotos
      },
      drone: {
        id: drone._id,
        droneId: drone.droneId,
        model: drone.model,
        serialNumber: drone.serialNumber
      }
    });

  } catch (error) {
    console.error('Drone assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
