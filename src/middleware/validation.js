import vine from '@vinejs/vine';
import { createRouteSchema, uploadRoutePhotosSchema, getRouteByIdSchema } from '../validations/route.validation.js';
import {
  createDroneSchema,
  updateDroneSchema,
  getDroneByIdSchema,
  deleteDroneSchema,
  assignDroneToRouteSchema
} from '../validations/drone.validation.js';

// Route validation middleware
export const validateCreateRoute = async(req, res, next) => {
  try {
    const validator = vine.compile(createRouteSchema);
    await validator.validate({ name: req.body.name, csv: req.files.csv, photos: req.files.photos });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUploadRoutePhotos = async(req, res, next) => {
  try {
    const validator = vine.compile(uploadRoutePhotosSchema);
    await validator.validate({ id: req.params.id, photos: req.files });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGetRouteById = async(req, res, next) => {
  try {
    const validator = vine.compile(getRouteByIdSchema);
    await validator.validate({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCreateDrone = async(req, res, next) => {
  try {
    const validator = vine.compile(createDroneSchema);
    await validator.validate(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateDrone = async(req, res, next) => {
  try {
    const validator = vine.compile(updateDroneSchema);
    await validator.validate({ ...req.body, id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGetDroneById = async(req, res, next) => {
  try {
    const validator = vine.compile(getDroneByIdSchema);
    await validator.validate({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateDeleteDrone = async(req, res, next) => {
  try {
    const validator = vine.compile(deleteDroneSchema);
    await validator.validate({ id: req.params.id });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateAssignDroneToRoute = async(req, res, next) => {
  try {
    const validator = vine.compile(assignDroneToRouteSchema);
    await validator.validate({ droneId: req.params.droneId, routeId: req.params.routeId });
    next();
  } catch (error) {
    next(error);
  }
};
