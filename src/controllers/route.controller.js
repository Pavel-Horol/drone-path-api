import droneModel from '@/models/drone.model';
import routeModel from '@/models/route.model';
import { parseCsvBuffer, getUniqueFileNames } from '@/services/scv.service';
import { uploadPhoto, getPhotoUrl } from '@/services/minio.service';
import { createError } from '@/utils/appError';

export async function createRoute(req, res) {
  if (!req.files.csv || req.files.csv.length === 0) {
    throw createError.badRequest('CSV file is required');
  }

  // Validate that drone exists
  const drone = await droneModel.findOne({
    $or: [
      { _id: req.body.droneId },
      { droneId: req.body.droneId }
    ]
  });

  if (!drone) {
    throw createError.notFound('Drone');
  }

  const csvFile = req.files.csv[0];
  const photoFiles = req.files.photos || [];
  const routeName = req.body.name || `Route_${Date.now()}`;

  console.log(`Processing route: ${routeName}`);
  console.log(`CSV file: ${csvFile.originalname} (${csvFile.size} bytes)`);
  console.log(`Photos: ${photoFiles.length} files`);

  let points;
  try {
    points = await parseCsvBuffer(csvFile.buffer);
  } catch (error) {
    throw createError.badRequest(`CSV parsing failed: ${error.message}`);
  }

  if (points.length === 0) {
    throw createError.badRequest('No valid data points found in CSV');
  }

  const route = new routeModel({
    name: routeName,
    droneId: drone.droneId,
    points: points
  });

  await route.save();
  console.log(`Created route ${route._id} with ${points.length} points`);

  const photoMap = new Map();
  photoFiles.forEach(photo => {
    photoMap.set(photo.originalname, photo);
  });

  let uploadedCount = 0;
  const uploadPromises = [];

  for (let i = 0; i < route.points.length; i++) {
    const point = route.points[i];
    const photo = photoMap.get(point.fileName);

    if (photo) {
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

  const requiredPhotos = getUniqueFileNames(points);
  const missingPhotos = requiredPhotos.filter(fileName => !photoMap.has(fileName));

  console.log(`Upload complete: ${uploadedCount}/${photoFiles.length} photos uploaded`);

  return res.status(201).json({
    id: route._id,
    name: route.name,
    droneId: route.droneId,
    status: route.status,
    totalPoints: route.totalPoints,
    pointsWithPhotos: route.pointsWithPhotos,
    requiredPhotos: requiredPhotos.length,
    uploadedPhotos: uploadedCount,
    missingPhotos: missingPhotos,
    createdAt: route.createdAt,
    drone: {
      id: drone._id,
      droneId: drone.droneId,
      model: drone.model,
      serialNumber: drone.serialNumber
    }
  });
}

// Upload missing photos for existing route
export async function uploadRoutePhotos(req, res) {
  try {
    const route = await routeModel.findById(req.params.id);
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

    return res.json({
      id: route._id,
      status: route.status,
      totalPoints: route.totalPoints,
      pointsWithPhotos: route.pointsWithPhotos,
      newPhotosAdded: uploadedCount,
      stillMissingPhotos: uniqueMissing
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Get route data for mapping
export async function getRouteById(req, res) {
  try {
    const route = await routeModel.findById(req.params.id);
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

    return res.json({
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// List all routes
export async function getAllRoutes(req, res) {
  try {
    const routes = await routeModel.find({}, {
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
}
