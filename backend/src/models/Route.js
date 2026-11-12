const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  sequence: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['pickup', 'school_drop', 'school_pickup', 'home_drop', 'railway_junction'],
    default: 'pickup',
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true,
    default: '07:00 AM',
  },
  walkingDistanceMeters: {
    type: Number,
    default: 150,
  },
  landmark: {
    type: String,
    default: '',
    trim: true,
  },
});

const routeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    routeCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    province: {
      type: String,
      default: 'Western',
      trim: true,
    },
    district: {
      type: String,
      default: 'Colombo',
      trim: true,
    },
    town: {
      type: String,
      default: '',
      trim: true,
    },
    destinationSchool: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    tripType: {
      type: String,
      enum: ['morning', 'afternoon', 'both'],
      default: 'both',
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 45,
    },
    distanceKm: {
      type: Number,
      default: 15,
    },
    startLocation: {
      name: { type: String, default: 'Starting Terminal' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    endLocation: {
      name: { type: String, default: 'Destination School' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    stops: [stopSchema],
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast searching across name, route code, province and district
routeSchema.index({ name: 'text', routeCode: 'text', destinationSchool: 'text' });
routeSchema.index({ province: 1, district: 1, isActive: 1 });

module.exports = mongoose.model('Route', routeSchema);
