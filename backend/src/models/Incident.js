const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['traffic_delay', 'breakdown', 'route_change', 'accident', 'weather', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    estimatedDelayMinutes: {
      type: Number,
      default: 15,
    },
    photoUrl: {
      type: String, // Cloudinary URL
      default: '',
    },
    status: {
      type: String,
      enum: ['reported', 'investigating', 'resolved'],
      default: 'reported',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Incident', incidentSchema);
