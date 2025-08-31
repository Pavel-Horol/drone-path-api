import vine from '@vinejs/vine';

export const createRouteSchema = vine.object({
  name: vine.string().optional(),
  csv: vine.any(), // File presence will be checked in controller
  photos: vine.any().optional()
});

export const uploadRoutePhotosSchema = vine.object({
  id: vine.string(),
  photos: vine.any()
});

export const getRouteByIdSchema = vine.object({
  id: vine.string()
});
