const mongoose = require('mongoose');

const vehicleLocationSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      index: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number, // km/h
      default: 0,
    },
    heading: {
      type: Number, // compass degrees 0-360
      default: 0,
    },
    accuracy: {
      type: Number, // meters
      default: 5,
    },
    batteryLevel: {
      type: Number, // percentage
      default: 100,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for latest location lookup
vehicleLocationSchema.index({ tripId: 1, recordedAt: -1 });

module.exports = mongoose.model('VehicleLocation', vehicleLocationSchema);
