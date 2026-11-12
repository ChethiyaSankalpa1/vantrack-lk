const mongoose = require('mongoose');

const absenceReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    absenceDate: {
      type: Date,
      required: [true, 'Absence date is required'],
      index: true,
    },
    absenceType: {
      type: String,
      enum: ['full_day', 'morning_only', 'afternoon_only', 'both_transport'],
      default: 'full_day',
    },
    reason: {
      type: String,
      enum: ['sick', 'family_matter', 'school_holiday', 'personal_reason', 'other'],
      default: 'sick',
    },
    additionalNote: {
      type: String,
      default: '',
      trim: true,
    },
    affectedTripIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
      },
    ],
    status: {
      type: String,
      enum: ['submitted', 'ACKNOWLEDGED', 'REJECTED', 'cancelled'],
      default: 'submitted',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

absenceReportSchema.index({ studentId: 1, absenceDate: 1, status: 1 });

module.exports = mongoose.model('AbsenceReport', absenceReportSchema);
