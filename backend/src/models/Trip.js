const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    tripType: {
      type: String,
      enum: ['morning_pickup', 'afternoon_drop'],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['scheduled', 'started', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    currentStopIndex: {
      type: Number,
      default: 0,
    },
    delayMinutes: {
      type: Number,
      default: 0,
    },
    delayReason: {
      type: String,
      default: '',
    },
    isGpsActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Trip', tripSchema);
