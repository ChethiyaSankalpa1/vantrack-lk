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
      enum: [
        'scheduled',
        'assigned',
        'ready',
        'started',
        'active',
        'completed',
        'cancelled',
        'interrupted',
      ],
      default: 'scheduled',
    },
    scheduledStartTime: {
      type: String,
      default: '06:30 AM',
    },
    scheduledEndTime: {
      type: String,
      default: '08:00 AM',
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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
    cancellationReason: {
      type: String,
      default: '',
    },
    emergencyNotes: {
      type: String,
      default: '',
    },
    replacementVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    initialLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ date: 1, status: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ vehicleId: 1 });
tripSchema.index({ routeId: 1 });

module.exports = mongoose.model('Trip', tripSchema);
