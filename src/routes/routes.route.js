import { Router } from 'express';
import multer, { memoryStorage } from 'multer';
import Route from '../models/route.model.js';
import * as routeController from '@/controllers/route.controller.js';
import { uploadPhoto, getPhotoUrl } from '../services/minio.service.js';

const router = Router();

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
]), routeController.createDrone);

// POST /routes/:id/photos - Upload missing photos for existing route
router.post('/:id/photos', upload.array('photos', 1000), async(req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No photos provided' });
    }

    console.log(`Adding ${req.files.length} photos to route ${route._id}`);

    const photoMap = new Map();
    req.files.forEach(photo => {
      photoMap.set(photo.originalname, photo);
    });

    let uploadedCount = 0;
    const uploadPromises = [];

    for (let i = 0; i < route.points.length; i++) {
      const point = route.points[i];

      if (!point.hasPhoto && photoMap.has(point.fileName)) {
        const photo = photoMap.get(point.fileName);

        const uploadPromise = uploadPhoto(route._id.toString(), point.fileName, photo.buffer, photo.mimetype)
          .then((objectKey) => {
            route.points[i].photoUrl = objectKey;
            route.points[i].hasPhoto = true;
            uploadedCount++;
          })
          .catch((error) => {
            console.error(`Failed to upload ${point.fileName}:`, error);
          });

        uploadPromises.push(uploadPromise);
      }
    }

    await Promise.all(uploadPromises);
    await route.save();

    const stillMissing = route.points.filter(p => !p.hasPhoto).map(p => p.fileName);
    const uniqueMissing = [...new Set(stillMissing)];

    console.log(`Photo upload complete: ${uploadedCount} new photos added`);

    res.json({
      id: route._id,
      status: route.status,
      totalPoints: route.totalPoints,
      pointsWithPhotos: route.pointsWithPhotos,
      newPhotosAdded: uploadedCount,
      stillMissingPhotos: uniqueMissing
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /routes/:id - Get route data for mapping
router.get('/:id', async(req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const pointsWithUrls = await Promise.all(route.points.map(async(point) => {
      let photoUrl = null;
      if (point.hasPhoto && point.photoUrl) {
        try {
          photoUrl = await getPhotoUrl(point.photoUrl);
        } catch (error) {
          console.error(`Error generating URL for ${point.fileName}:`, error);
        }
      }

      return {
        fileName: point.fileName,
        date: point.date,
        time: point.time,
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude,
        speed: point.speed,
        course: point.course,
        sensorData: {
          aex: point.aex,
          spp: point.spp,
          srr: point.srr,
          mLux: point.mLux,
          rIr1: point.rIr1,
          gIr: point.gIr,
          rIr2: point.rIr2,
          iIr: point.iIr,
          iBright: point.iBright,
          shutter: point.shutter,
          gain: point.gain
        },
        hasPhoto: point.hasPhoto,
        photoUrl
      };
    }));

    res.json({
      id: route._id,
      name: route.name,
      droneId: route.droneId,
      status: route.status,
      totalPoints: route.totalPoints,
      pointsWithPhotos: route.pointsWithPhotos,
      createdAt: route.createdAt,
      updatedAt: route.updatedAt,
      points: pointsWithUrls
    });

  } catch (error) {
    console.error('Route retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /routes - List all routes
router.get('/', async(req, res) => {
  try {
    const routes = await Route.find({}, {
      name: 1,
      droneId: 1,
      status: 1,
      totalPoints: 1,
      pointsWithPhotos: 1,
      createdAt: 1,
      updatedAt: 1
    }).sort({ createdAt: -1 });

    res.json(routes);
  } catch (error) {
    console.error('Routes listing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
