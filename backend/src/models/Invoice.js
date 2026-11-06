const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    monthYear: {
      type: String, // e.g. "2026-11"
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 7500, // LKR
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['unpaid', 'pending_verification', 'paid', 'overdue'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'payhere_online', 'cash_to_driver', 'none'],
      default: 'none',
    },
    receiptUrl: {
      type: String, // Cloudinary URL for bank slip or digital receipt
      default: '',
    },
    payherePaymentId: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
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

module.exports = mongoose.model('Invoice', invoiceSchema);
