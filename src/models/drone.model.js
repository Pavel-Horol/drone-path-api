import { Schema, model } from 'mongoose';

const droneSchema = new Schema({
  droneId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  currentBatteryCharge: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  totalFlightTime: {
    type: Number,
    default: 0,
    min: 0
  }, // in minutes
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
droneSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

droneSchema.virtual('routes', {
  ref: 'Route',
  localField: 'droneId',
  foreignField: 'droneId'
});

droneSchema.set('toObject', { virtuals: true });
droneSchema.set('toJSON', { virtuals: true });

// Index for faster queries
droneSchema.index({ droneId: 1 });
droneSchema.index({ serialNumber: 1 });

export default model('Drone', droneSchema);
