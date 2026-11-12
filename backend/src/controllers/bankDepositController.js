const BankDeposit = require('../models/BankDeposit');
const BankAccount = require('../models/BankAccount');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../services/notificationService');

const logAudit = async (req, action, targetId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      action,
      targetType: 'BankDeposit',
      targetId,
      details,
      ipAddress: req.ip || '',
    });
  } catch (_) {}
};

/**
 * @desc    Parent Submits Bank Deposit Receipt
 * @route   POST /api/invoices/:id/bank-deposit
 * @access  Private (Parent)
 */
exports.submitBankDeposit = async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const {
      bankAccountId,
      depositorName,
      depositDate,
      depositReferenceNumber,
      receiptFileUrl,
      notes,
    } = req.body;

    if (!bankAccountId || !depositorName || !depositDate || !receiptFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Bank account, depositor name, deposit date, and receipt file URL are required.',
      });
    }

    // Verify invoice ownership
    const invoice = await Invoice.findById(invoiceId).populate('studentId');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only submit payments for your own invoices.',
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This invoice is already paid.' });
    }

    if (invoice.status === 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'A payment receipt for this invoice is already pending verification.',
      });
    }

    // Verify bank account exists & is active
    const bankAccount = await BankAccount.findById(bankAccountId);
    if (!bankAccount || !bankAccount.isActive || bankAccount.isArchived) {
      return res.status(400).json({
        success: false,
        message: 'Selected bank account is no longer active. Please select another account.',
      });
    }

    // Generate unique deposit reference
    const depositReference = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const bankDeposit = await BankDeposit.create({
      depositReference,
      invoiceId: invoice._id,
      parentId: req.user._id,
      studentId: invoice.studentId._id || invoice.studentId,
      bankAccountId: bankAccount._id,
      bankAccountSnapshot: {
        bankName: bankAccount.bankName,
        accountHolderName: bankAccount.accountHolderName,
        accountNumber: bankAccount.accountNumber,
        branchName: bankAccount.branchName,
        accountType: bankAccount.accountType,
      },
      amount: invoice.amount,
      currency: invoice.currency || 'LKR',
      depositorName: depositorName.trim(),
      depositDate: new Date(depositDate),
      depositReferenceNumber: depositReferenceNumber ? depositReferenceNumber.trim() : '',
      receiptFileUrl: receiptFileUrl.trim(),
      status: 'pending_verification',
      notes: notes ? notes.trim() : '',
    });

    // Update invoice state
    invoice.status = 'pending_verification';
    invoice.paymentMethod = 'bank_transfer';
    invoice.receiptUrl = receiptFileUrl.trim();
    await invoice.save();

    const io = req.app.get('io');

    // Notify Parent confirmation
    await sendNotification({
      userId: req.user._id,
      title: '📄 Bank Deposit Submitted',
      message: `Your payment slip for invoice ${invoice.invoiceNumber} (LKR ${invoice.amount}) was received and is pending verification.`,
      type: 'payment_receipt',
      data: { invoiceId: invoice._id.toString(), depositId: bankDeposit._id.toString() },
      io,
    });

    res.status(201).json({
      success: true,
      message: 'Bank deposit receipt submitted successfully. Verification in progress.',
      data: bankDeposit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get All Bank Deposit Submissions (Admin)
 * @route   GET /api/admin/bank-deposits
 * @access  Private (Admin)
 */
exports.getAdminBankDeposits = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const deposits = await BankDeposit.find(filter)
      .populate('invoiceId', 'invoiceNumber monthYear amount status dueDate')
      .populate('parentId', 'name phone email')
      .populate('studentId', 'name schoolName grade')
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await BankDeposit.countDocuments(filter);
    const pendingCount = await BankDeposit.countDocuments({ status: 'pending_verification' });
    const approvedCount = await BankDeposit.countDocuments({ status: 'APPROVED' });
    const rejectedCount = await BankDeposit.countDocuments({ status: 'REJECTED' });

    res.status(200).json({
      success: true,
      count: deposits.length,
      total,
      stats: {
        pendingCount,
        approvedCount,
        rejectedCount,
      },
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: deposits,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin Approve Bank Deposit
 * @route   POST /api/admin/bank-deposits/:id/approve
 * @access  Private (Admin)
 */
exports.approveBankDeposit = async (req, res) => {
  try {
    const deposit = await BankDeposit.findById(req.params.id)
      .populate('invoiceId')
      .populate('parentId', 'name email phone');

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Bank deposit record not found.' });
    }

    if (deposit.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'This deposit has already been approved.' });
    }

    deposit.status = 'APPROVED';
    deposit.verifiedBy = req.user._id;
    deposit.verifiedAt = new Date();
    await deposit.save();

    // Update associated invoice to paid
    const invoice = await Invoice.findById(deposit.invoiceId._id || deposit.invoiceId);
    if (invoice) {
      invoice.status = 'paid';
      invoice.paymentMethod = 'bank_transfer';
      invoice.paidAt = new Date();
      await invoice.save();
    }

    await logAudit(req, 'BANK_DEPOSIT_APPROVED', deposit._id, {
      invoiceNumber: invoice ? invoice.invoiceNumber : '',
      amount: deposit.amount,
      parentId: deposit.parentId._id,
    });

    const io = req.app.get('io');
    await sendNotification({
      userId: deposit.parentId._id,
      title: '✅ Transport Payment Approved',
      message: `Your bank deposit payment of LKR ${deposit.amount} for invoice ${invoice?.invoiceNumber || ''} has been verified and approved.`,
      type: 'payment_receipt',
      data: { invoiceId: invoice?._id.toString(), depositId: deposit._id.toString() },
      io,
    });

    res.status(200).json({
      success: true,
      message: 'Bank deposit verified and approved successfully.',
      data: deposit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin Reject Bank Deposit
 * @route   POST /api/admin/bank-deposits/:id/reject
 * @access  Private (Admin)
 */
exports.rejectBankDeposit = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory rejection reason must be provided.',
      });
    }

    const deposit = await BankDeposit.findById(req.params.id)
      .populate('invoiceId')
      .populate('parentId', 'name email phone');

    if (!deposit) {
      return res.status(404).json({ success: false, message: 'Bank deposit record not found.' });
    }

    if (deposit.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Cannot reject an already approved deposit.' });
    }

    deposit.status = 'REJECTED';
    deposit.rejectionReason = rejectionReason.trim();
    deposit.verifiedBy = req.user._id;
    deposit.verifiedAt = new Date();
    await deposit.save();

    // Reset invoice status back to unpaid so parent can re-submit slip
    const invoice = await Invoice.findById(deposit.invoiceId._id || deposit.invoiceId);
    if (invoice) {
      invoice.status = 'unpaid';
      await invoice.save();
    }

    await logAudit(req, 'BANK_DEPOSIT_REJECTED', deposit._id, {
      reason: rejectionReason.trim(),
    });

    const io = req.app.get('io');
    await sendNotification({
      userId: deposit.parentId._id,
      title: '❌ Bank Deposit Verification Rejected',
      message: `Your deposit slip for ${invoice?.invoiceNumber || 'invoice'} was rejected. Reason: ${rejectionReason.trim()}`,
      type: 'payment_due',
      data: { invoiceId: invoice?._id.toString(), depositId: deposit._id.toString() },
      io,
    });

    res.status(200).json({
      success: true,
      message: 'Bank deposit rejected. Parent notified with rejection reason.',
      data: deposit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
