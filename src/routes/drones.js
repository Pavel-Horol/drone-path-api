import { Router } from 'express';
import Drone from '../models/Drone.js';
import Route from '../models/Route.js';

const router = Router();

// POST /drones - Create new drone
router.post('/', async (req, res) => {
  try {
    const { model, serialNumber, manufacturer, description } = req.body;

    // Validate required fields
    if (!model || !serialNumber || !manufacturer) {
      return res.status(400).json({ 
        error: 'Missing required fields: model, serialNumber, and manufacturer are required' 
      });
    }

    const drone = new Drone({
      model: model.trim(),
      serialNumber: serialNumber.trim(),
      manufacturer: manufacturer.trim(),
      description: description?.trim()
    });

    await drone.save();

    console.log(`Created new drone: ${drone.model} (${drone.serialNumber})`);

    res.status(201).json({
      id: drone._id,
      model: drone.model,
      serialNumber: drone.serialNumber,
      manufacturer: drone.manufacturer,
      description: drone.description,
      createdAt: drone.createdAt,
      updatedAt: drone.updatedAt
    });

  } catch (error) {
    console.error('Drone creation error:', error);
    
    if (error.code === 11000) {
      // Duplicate serial number
      return res.status(409).json({ 
        error: 'A drone with this serial number already exists' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drones - List all drones
router.get('/', async (req, res) => {
  try {
    const drones = await Drone.find({}).sort({ createdAt: -1 });
    
    res.json(drones);
  } catch (error) {
    console.error('Drones listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drones/:id - Get specific drone details
router.get('/:id', async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);
    
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    // Also get routes that use this drone
    const routes = await Route.find({ droneId: drone._id }, {
      name: 1,
      status: 1,
      totalPoints: 1,
      pointsWithPhotos: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    res.json({
      id: drone._id,
      model: drone.model,
      serialNumber: drone.serialNumber,
      manufacturer: drone.manufacturer,
      description: drone.description,
      createdAt: drone.createdAt,
      updatedAt: drone.updatedAt,
      routes: routes
    });

  } catch (error) {
    console.error('Drone retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /drones/:id - Update drone information
router.put('/:id', async (req, res) => {
  try {
    const { model, serialNumber, manufacturer, description } = req.body;
    
    const drone = await Drone.findById(req.params.id);
    
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    // Update fields if provided
    if (model) drone.model = model.trim();
    if (serialNumber) drone.serialNumber = serialNumber.trim();
    if (manufacturer) drone.manufacturer = manufacturer.trim();
    if (description !== undefined) drone.description = description?.trim();

    await drone.save();

    console.log(`Updated drone: ${drone.model} (${drone.serialNumber})`);

    res.json({
      id: drone._id,
      model: drone.model,
      serialNumber: drone.serialNumber,
      manufacturer: drone.manufacturer,
      description: drone.description,
      createdAt: drone.createdAt,
      updatedAt: drone.updatedAt
    });

  } catch (error) {
    console.error('Drone update error:', error);
    
    if (error.code === 11000) {
      // Duplicate serial number
      return res.status(409).json({ 
        error: 'A drone with this serial number already exists' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /drones/:id - Delete drone
router.delete('/:id', async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);
    
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }

    // Check if drone is used in any routes
    const routesCount = await Route.countDocuments({ droneId: drone._id });
    
    if (routesCount > 0) {
      return res.status(409).json({ 
        error: `Cannot delete drone. It is currently used in ${routesCount} route(s)` 
      });
    }

    await Drone.findByIdAndDelete(req.params.id);

    console.log(`Deleted drone: ${drone.model} (${drone.serialNumber})`);

    res.json({ 
      message: 'Drone deleted successfully',
      deletedDrone: {
        id: drone._id,
        model: drone.model,
        serialNumber: drone.serialNumber
      }
    });

  } catch (error) {
    console.error('Drone deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
