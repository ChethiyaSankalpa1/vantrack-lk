const mongoose = require('mongoose');

const bankDepositSchema = new mongoose.Schema(
  {
    depositReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: true,
    },
    // Immutable snapshot of bank details at time of submission
    bankAccountSnapshot: {
      bankName: { type: String, required: true },
      accountHolderName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      branchName: { type: String, required: true },
      accountType: { type: String, default: 'Savings' },
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'LKR',
    },
    depositorName: {
      type: String,
      required: [true, 'Depositor name is required'],
      trim: true,
    },
    depositDate: {
      type: Date,
      required: [true, 'Deposit date is required'],
    },
    depositReferenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    receiptFileUrl: {
      type: String,
      required: [true, 'Deposit receipt/slip file URL is required'],
    },
    status: {
      type: String,
      enum: ['pending_verification', 'APPROVED', 'REJECTED'],
      default: 'pending_verification',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
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

bankDepositSchema.index({ invoiceId: 1, status: 1 });

module.exports = mongoose.model('BankDeposit', bankDepositSchema);
