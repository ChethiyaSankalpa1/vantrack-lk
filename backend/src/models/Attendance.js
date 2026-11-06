const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['boarded', 'dropped_off', 'absent', 'not_boarded'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['qr_scan', 'manual'],
      default: 'manual',
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for the same student on the same trip and same event status
attendanceSchema.index({ studentId: 1, tripId: 1, status: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
