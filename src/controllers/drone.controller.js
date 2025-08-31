import Drone from '../models/drone.model.js';
import Route from '../models/route.model.js';
import { createError } from '../utils/appError.js';

// Create new drone - ZERO WRAPPERS: Just throw errors, they're caught automatically!
export async function createDrone(req, res) {
  const { model, serialNumber, currentBatteryCharge, totalFlightTime } = req.body;


  const drone = await Drone.create({
    model,
    serialNumber,
    currentBatteryCharge: currentBatteryCharge || 100,
    totalFlightTime: totalFlightTime || 0
  });

  res.status(201).json({
    id: drone._id,
    model: drone.model,
    serialNumber: drone.serialNumber,
    currentBatteryCharge: drone.currentBatteryCharge,
    totalFlightTime: drone.totalFlightTime,
    createdAt: drone.createdAt
  });
}

// List all drones
export async function getAllDrones(req, res) {
  const drones = await Drone.find({}, {
    model: 1,
    serialNumber: 1,
    currentBatteryCharge: 1,
    totalFlightTime: 1,
    createdAt: 1,
    updatedAt: 1
  }).sort({ createdAt: -1 });

  return res.json(drones);
}

// Get specific drone details
export async function getDroneById(req, res) {
  const drone = await Drone
    .findById(req.params.id)
    .populate({
      path: 'routes',
      select: 'name status totalPoints pointsWithPhotos createdAt',
      options: { sort: { createdAt: -1 } }
    })
    .lean();

  if (!drone) throw createError.notFound('Drone');

  return res.json(drone);
}

// Update drone info
export async function updateDrone(req, res) {
  const { model, currentBatteryCharge, totalFlightTime } = req.body;

  const updateData = {};
  if (model !== undefined) updateData.model = model;
  if (currentBatteryCharge !== undefined) {
    if (currentBatteryCharge < 0 || currentBatteryCharge > 100) {
      throw createError.badRequest('currentBatteryCharge must be between 0 and 100');
    }
    updateData.currentBatteryCharge = currentBatteryCharge;
  }
  if (totalFlightTime !== undefined) {
    if (totalFlightTime < 0) throw createError.badRequest('totalFlightTime cannot be negative');

    updateData.totalFlightTime = totalFlightTime;
  }

  const drone = await Drone.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!drone) throw createError.notFound('Drone');


  return res.json({
    id: drone._id,
    model: drone.model,
    serialNumber: drone.serialNumber,
    currentBatteryCharge: drone.currentBatteryCharge,
    totalFlightTime: drone.totalFlightTime,
    updatedAt: drone.updatedAt
  });
}

// Delete drone
export async function deleteDrone(req, res) {
  const drone = await Drone.findById(req.params.id);

  if (!drone) throw createError.notFound('Drone');


  const routeCount = await Route.countDocuments({ droneId: drone._id });

  if (routeCount > 0) throw createError.badRequest(`Cannot delete drone. It has ${routeCount} associated routes. Delete routes first.`);


  await Drone.findByIdAndDelete(drone._id);

  return res.json({
    message: 'Drone deleted successfully',
    deletedDrone: {
      id: drone._id,
      model: drone.model,
      serialNumber: drone.serialNumber
    }
  });
}

// Assign drone to route
export async function assignDroneToRoute(req, res) {
  const drone = await Drone.findById(req.params.droneId);

  if (!drone) throw createError.notFound('Drone');


  const route = await Route.findById(req.params.routeId);
  if (!route) throw createError.notFound('Route');


  route.droneId = drone._id;
  await route.save();

  return res.json({
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
      model: drone.model,
      serialNumber: drone.serialNumber
    }
  });
}
