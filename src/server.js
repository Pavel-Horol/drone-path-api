import app from './app.js';
import { config } from './config/index.js';
import { connectToDatabase } from './config/db.config.js';
import { initializeMinio } from './services/minio.service.js';

async function start() {
  await connectToDatabase();
  await initializeMinio();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start();
