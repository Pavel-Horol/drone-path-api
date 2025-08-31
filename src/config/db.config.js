import { config } from './index.js';
import { connect } from 'mongoose';

export async function connectToDatabase() {
  try {
    await connect(config.mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
