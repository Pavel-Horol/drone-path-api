import { config } from '../config/index.js';
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: false,
  accessKey: config.minio.accessKey || 'minioadmin',
  secretKey: config.minio.secretKey || 'minioadmin'
});

export const BUCKET_NAME = config.minio.bucket;

export async function initializeMinio() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket '${BUCKET_NAME}' created successfully`);
    } else {
      console.log(`Bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (error) {
    console.error('Error initializing MinIO:', error);
    throw error;
  }
}

export async function uploadPhoto(routeId, fileName, fileBuffer, contentType) {
  try {
    const objectKey = `routes/${routeId}/${fileName}`;

    const metaData = {
      'Content-Type': contentType || 'image/tiff',
      'X-Route-ID': routeId
    };

    await minioClient.putObject(BUCKET_NAME, objectKey, fileBuffer, fileBuffer.length, metaData);
    return objectKey;
  } catch (error) {
    console.error('Error uploading photo to MinIO:', error);
    throw error;
  }
}

export async function getPhotoUrl(objectKey) {
  try {
    const url = await minioClient.presignedGetObject(
      BUCKET_NAME,
      objectKey,
      60 * 60
    );
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

export async function photoExists(objectKey) {
  try {
    await minioClient.statObject(BUCKET_NAME, objectKey);
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}
