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
    tripType: {
      type: String,
      enum: ['morning', 'afternoon', 'both'],
      default: 'both',
    },
    startLocation: {
      name: { type: String, default: 'Maharagama Junction' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    endLocation: {
      name: { type: String, default: 'Colombo 07 School Zone' },
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

module.exports = mongoose.model('Route', routeSchema);
