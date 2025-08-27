import { Schema, model } from 'mongoose';

const pointSchema = new Schema({
  fileName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  timeStatus: { type: String },
  aex: { type: String },
  latitude: { type: String, required: true },
  longitude: { type: String, required: true },
  speed: { type: String },
  course: { type: String },
  magn: { type: String },
  altitude: { type: String },
  spp: { type: String },
  srr: { type: String },
  mLux: { type: String },
  rIr1: { type: String },
  gIr: { type: String },
  rIr2: { type: String },
  iIr: { type: String },
  iBright: { type: String },
  shutter: { type: String },
  gain: { type: String },
  photoUrl: { type: String }, // MinIO object key or URL
  hasPhoto: { type: Boolean, default: false }
}, { _id: false });

const routeSchema = new Schema({
  name: { type: String, required: true },
  droneId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Drone',
    required: false 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  totalPoints: { type: Number, default: 0 },
  pointsWithPhotos: { type: Number, default: 0 },
  points: [pointSchema],
  status: { 
    type: String, 
    enum: ['processing', 'complete', 'partial'], 
    default: 'processing' 
  }
});

// Virtual populate for drone data
routeSchema.virtual('drone', {
  ref: 'Drone',
  localField: 'droneId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are included in JSON output
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

// Update timestamps on save
routeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.totalPoints = this.points.length;
  this.pointsWithPhotos = this.points.filter(p => p.hasPhoto).length;
  
  // Set status based on photo completion
  if (this.pointsWithPhotos === 0) {
    this.status = 'processing';
  } else if (this.pointsWithPhotos === this.totalPoints) {
    this.status = 'complete';
  } else {
    this.status = 'partial';
  }
  
  next();
});

export default model('Route', routeSchema);
