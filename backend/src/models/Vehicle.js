const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required (e.g., WP NB-4589)'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    makeModel: {
      type: String,
      default: 'Toyota HiAce KDH',
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 16,
    },
    color: {
      type: String,
      default: 'School Yellow / White',
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    currentTripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'in_trip', 'maintenance', 'inactive'],
      default: 'active',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    insuranceExpiry: {
      type: Date,
    },
    revenueLicenseExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
