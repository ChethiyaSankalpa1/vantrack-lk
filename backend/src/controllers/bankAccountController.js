const BankAccount = require('../models/BankAccount');
const BankDeposit = require('../models/BankDeposit');
const AuditLog = require('../models/AuditLog');

const logAudit = async (req, action, targetId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      action,
      targetType: 'BankAccount',
      targetId,
      details,
      ipAddress: req.ip || '',
    });
  } catch (_) {}
};

/**
 * @desc    Get all bank accounts for Admin
 * @route   GET /api/admin/bank-accounts
 * @access  Private (Admin)
 */
exports.getAdminBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ isArchived: false })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get active bank accounts for Parents (Default account listed first)
 * @route   GET /api/bank-accounts/active
 * @access  Private (Parent/Authenticated)
 */
exports.getPublicBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({
      isActive: true,
      isArchived: false,
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create new Bank Account
 * @route   POST /api/admin/bank-accounts
 * @access  Private (Admin)
 */
exports.createBankAccount = async (req, res) => {
  try {
    const {
      bankName,
      accountHolderName,
      accountNumber,
      branchName,
      branchCode,
      accountType,
      instructions,
      displayName,
      isDefault,
    } = req.body;

    if (!bankName || !accountHolderName || !accountNumber || !branchName) {
      return res.status(400).json({
        success: false,
        message: 'Bank Name, Account Holder, Account Number, and Branch are required.',
      });
    }

    // Check if another account exists
    const count = await BankAccount.countDocuments({ isArchived: false });
    const shouldBeDefault = isDefault || count === 0;

    if (shouldBeDefault) {
      // Remove default from all existing accounts
      await BankAccount.updateMany({}, { isDefault: false });
    }

    const account = await BankAccount.create({
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      branchName: branchName.trim(),
      branchCode: branchCode ? branchCode.trim() : '',
      accountType: accountType || 'Savings',
      instructions: instructions || 'Please deposit the invoice amount and upload the receipt/slip.',
      displayName: displayName || `${bankName.trim()} - ${accountNumber.trim()}`,
      isDefault: shouldBeDefault,
      isActive: true,
      isArchived: false,
    });

    await logAudit(req, 'BANK_ACCOUNT_CREATED', account._id, {
      bankName,
      accountNumber,
      isDefault: shouldBeDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Bank account added successfully.',
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Bank Account
 * @route   PUT /api/admin/bank-accounts/:id
 * @access  Private (Admin)
 */
exports.updateBankAccount = async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account || account.isArchived) {
      return res.status(404).json({ success: false, message: 'Bank account not found.' });
    }

    const {
      bankName,
      accountHolderName,
      accountNumber,
      branchName,
      branchCode,
      accountType,
      instructions,
      displayName,
      isDefault,
    } = req.body;

    if (isDefault) {
      await BankAccount.updateMany({ _id: { $ne: account._id } }, { isDefault: false });
      account.isDefault = true;
    }

    if (bankName) account.bankName = bankName.trim();
    if (accountHolderName) account.accountHolderName = accountHolderName.trim();
    if (accountNumber) account.accountNumber = accountNumber.trim();
    if (branchName) account.branchName = branchName.trim();
    if (branchCode !== undefined) account.branchCode = branchCode.trim();
    if (accountType) account.accountType = accountType;
    if (instructions !== undefined) account.instructions = instructions;
    if (displayName !== undefined) account.displayName = displayName;

    await account.save();

    await logAudit(req, 'BANK_ACCOUNT_UPDATED', account._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Bank account updated successfully.',
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Set default Bank Account
 * @route   PATCH /api/admin/bank-accounts/:id/default
 * @access  Private (Admin)
 */
exports.setDefaultBankAccount = async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account || account.isArchived) {
      return res.status(404).json({ success: false, message: 'Bank account not found.' });
    }

    await BankAccount.updateMany({}, { isDefault: false });
    account.isDefault = true;
    account.isActive = true; // Default account must be active
    await account.save();

    await logAudit(req, 'BANK_ACCOUNT_SET_DEFAULT', account._id, {
      bankName: account.bankName,
    });

    res.status(200).json({
      success: true,
      message: `${account.bankName} (${account.accountNumber}) set as default payment destination.`,
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Enable / Disable Bank Account
 * @route   PATCH /api/admin/bank-accounts/:id/status
 * @access  Private (Admin)
 */
exports.toggleBankAccountStatus = async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account || account.isArchived) {
      return res.status(404).json({ success: false, message: 'Bank account not found.' });
    }

    if (account.isDefault && account.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot disable the default bank account. Please set another default account first.',
      });
    }

    account.isActive = !account.isActive;
    await account.save();

    await logAudit(req, 'BANK_ACCOUNT_STATUS_TOGGLED', account._id, {
      isActive: account.isActive,
    });

    res.status(200).json({
      success: true,
      message: `Bank account ${account.isActive ? 'enabled' : 'disabled'} successfully.`,
      data: account,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Safely archive / soft-delete Bank Account
 * @route   DELETE /api/admin/bank-accounts/:id
 * @access  Private (Admin)
 */
exports.archiveBankAccount = async (req, res) => {
  try {
    const account = await BankAccount.findById(req.params.id);
    if (!account || account.isArchived) {
      return res.status(404).json({ success: false, message: 'Bank account not found.' });
    }

    if (account.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the default bank account. Assign another default account first.',
      });
    }

    // Soft delete to preserve historical deposit records
    account.isArchived = true;
    account.isActive = false;
    account.isDefault = false;
    await account.save();

    await logAudit(req, 'BANK_ACCOUNT_ARCHIVED', account._id, {
      bankName: account.bankName,
    });

    res.status(200).json({
      success: true,
      message: 'Bank account archived safely. Historical payment records remain intact.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
