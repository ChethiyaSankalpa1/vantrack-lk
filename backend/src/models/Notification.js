const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'trip_start',
        'student_boarded',
        'student_dropped',
        'attendance_alert',
        'approaching_stop',
        'delay',
        'breakdown',
        'payment_due',
        'payment_receipt',
        'general',
      ],
      default: 'general',
    },
    data: {
      studentId: String,
      tripId: String,
      invoiceId: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
