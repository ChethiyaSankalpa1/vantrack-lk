const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide student name'],
      trim: true,
    },
    admissionNumber: {
      type: String,
      trim: true,
      default: '',
    },
    schoolName: {
      type: String,
      required: [true, 'Please provide school name'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Please specify grade/class (e.g., Grade 6-B)'],
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student must be linked to a parent account'],
    },
    assignedVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    assignedRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
    },
    pickupLocation: {
      address: { type: String, default: '' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      scheduledTime: { type: String, default: '06:45 AM' },
    },
    dropoffLocation: {
      address: { type: String, default: '' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      scheduledTime: { type: String, default: '02:15 PM' },
    },
    qrCodeString: {
      type: String,
      unique: true,
      sparse: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    monthlyFee: {
      type: Number,
      default: 7500, // LKR
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique QR code identifier string on creation if not provided
studentSchema.pre('save', function (next) {
  if (!this.qrCodeString) {
    this.qrCodeString = `VANTRACK_STU_${this._id.toString()}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
