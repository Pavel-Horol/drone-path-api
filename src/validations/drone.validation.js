import vine from '@vinejs/vine';

export const createDroneSchema = vine.object({
  model: vine.string(),
  serialNumber: vine.string(),
  currentBatteryCharge: vine.number().min(0).max(100).optional(),
  totalFlightTime: vine.number().min(0).optional()
});

export const updateDroneSchema = vine.object({
  model: vine.string().optional(),
  currentBatteryCharge: vine.number().min(0).max(100).optional(),
  totalFlightTime: vine.number().min(0).optional()
});

export const getDroneByIdSchema = vine.object({
  id: vine.string()
});

export const deleteDroneSchema = vine.object({
  id: vine.string()
});

export const assignDroneToRouteSchema = vine.object({
  droneId: vine.string(),
  routeId: vine.string()
});
