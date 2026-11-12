const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
    },
    branchName: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    branchCode: {
      type: String,
      default: '',
      trim: true,
    },
    accountType: {
      type: String,
      enum: ['Savings', 'Current'],
      default: 'Savings',
    },
    instructions: {
      type: String,
      default: 'Please deposit the invoice amount and upload the receipt/slip.',
    },
    displayName: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bankAccountSchema.index({ isActive: 1, isDefault: -1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
