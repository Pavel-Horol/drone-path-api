import app from './app.js';
import { config } from './config/index.js';
import { connectToDatabase } from './config/db.js';
import { initializeMinio } from './services/minioService.js';

async function start() {
  await connectToDatabase();
  await initializeMinio();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start();
