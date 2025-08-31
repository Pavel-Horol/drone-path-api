import droneModel from '@/models/drone.model';
import routeModel from '@/models/route.model';
import { parseCsvBuffer, getUniqueFileNames } from '@/services/scv.service';
import { uploadPhoto } from '@/services/minio.service';
import { createError } from '@/utils/appError';

export async function createDrone(req, res) {
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
