import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/drone_routes',
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
    bucket: process.env.MINIO_BUCKET || 'drone-photos'
  }
};
