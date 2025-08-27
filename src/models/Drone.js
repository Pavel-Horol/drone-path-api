import { Schema, model } from 'mongoose';

const droneSchema = new Schema({
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
  manufacturer: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
  },
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

// Ensure serial number is unique
droneSchema.index({ serialNumber: 1 }, { unique: true });

export default model('Drone', droneSchema);
