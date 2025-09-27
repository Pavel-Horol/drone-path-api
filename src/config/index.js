import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/drone_routes',
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000,
    serverUrl: process.env.MINIO_SERVER_URL,
    bucket: process.env.MINIO_BUCKET || 'drone-photos'
  }
};
