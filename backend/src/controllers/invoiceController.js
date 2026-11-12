const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

/**
 * @desc    Get user's invoices (Parents get their children's invoices; Admin gets all)
 * @route   GET /api/invoices
 * @access  Private
 */
exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.user.role === 'parent') {
      filter.parentId = req.user._id;
    }

    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }

    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const invoices = await Invoice.find(filter)
      .populate('studentId', 'name admissionNumber schoolName grade photoUrl')
      .populate('parentId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Invoice.countDocuments(filter);

    // Calculate summary statistics
    const allParentInvoices = await Invoice.find(req.user.role === 'parent' ? { parentId: req.user._id } : {}).lean();
    let totalOutstanding = 0;
    let totalPaid = 0;
    let unpaidCount = 0;

    for (const inv of allParentInvoices) {
      if (inv.status === 'unpaid' || inv.status === 'overdue') {
        totalOutstanding += inv.amount;
        unpaidCount++;
      } else if (inv.status === 'paid') {
        totalPaid += inv.amount;
      }
    }

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      summary: {
        totalOutstanding,
        totalPaid,
        unpaidCount,
        currency: 'LKR',
      },
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single invoice details with digital receipt
 * @route   GET /api/invoices/:id
 * @access  Private
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('studentId', 'name admissionNumber schoolName grade pickupLocation dropoffLocation')
      .populate('parentId', 'name phone email address');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Verify ownership
    if (req.user.role === 'parent' && invoice.parentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this invoice' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Upload Bank Transfer Deposit Slip
 * @route   POST /api/invoices/:id/receipt
 * @access  Private (Parent)
 */
exports.uploadReceipt = async (req, res) => {
  try {
    const { receiptUrl, notes } = req.body;
    if (!receiptUrl) {
      return res.status(400).json({ success: false, message: 'receiptUrl is required' });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.receiptUrl = receiptUrl;
    invoice.status = 'pending_verification';
    invoice.paymentMethod = 'bank_transfer';
    if (notes) invoice.notes = notes;
    await invoice.save();

    const io = req.app.get('io');
    await sendNotification({
      userId: invoice.parentId,
      title: '📄 Bank Slip Submitted',
      message: `Your payment slip for invoice ${invoice.invoiceNumber} (LKR ${invoice.amount}) has been submitted for verification.`,
      type: 'payment_receipt',
      data: { invoiceId: invoice._id.toString() },
      io,
    });

    res.status(200).json({
      success: true,
      message: 'Bank transfer receipt uploaded successfully. Verification in progress.',
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Initiate PayHere Online Payment (generate secure hash & payload)
 * @route   POST /api/invoices/:id/payhere-checkout
 * @access  Private (Parent)
 */
exports.initiatePayHere = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('studentId', 'name schoolName')
      .populate('parentId', 'name phone email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already paid' });
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID || '1234567';
    const merchantSecret = process.env.PAYHERE_SECRET || 'secret123';
    const currency = 'LKR';
    const amountFormatted = parseFloat(invoice.amount).toFixed(2);

    // PayHere MD5 Checksum: MD5(merchant_id + order_id + amount + currency + strtoupper(MD5(merchant_secret)))
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const hash = crypto
      .createHash('md5')
      .update(merchantId + invoice.invoiceNumber + amountFormatted + currency + hashedSecret)
      .digest('hex')
      .toUpperCase();

    const parentName = (invoice.parentId?.name || 'Valued Parent').split(' ');
    const firstName = parentName[0] || 'Parent';
    const lastName = parentName.slice(1).join(' ') || 'Customer';

    const checkoutParams = {
      sandbox: process.env.NODE_ENV !== 'production',
      merchant_id: merchantId,
      return_url: 'https://vantrack-lk.onrender.com/api/invoices/payhere/return',
      cancel_url: 'https://vantrack-lk.onrender.com/api/invoices/payhere/cancel',
      notify_url: 'https://vantrack-lk.onrender.com/api/invoices/payhere/notify',
      order_id: invoice.invoiceNumber,
      items: `VanTrack LK Monthly School Transport - ${invoice.monthYear} (${invoice.studentId?.name || ''})`,
      amount: amountFormatted,
      currency,
      hash,
      first_name: firstName,
      last_name: lastName,
      email: invoice.parentId?.email || 'parent@vantrack.lk',
      phone: invoice.parentId?.phone || '+94771234567',
      address: 'Sri Lanka',
      city: 'Colombo',
      country: 'Sri Lanka',
      custom_1: invoice._id.toString(),
    };

    res.status(200).json({
      success: true,
      message: 'PayHere checkout session initialized',
      data: checkoutParams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    PayHere IPN Webhook Notification Listener
 * @route   POST /api/invoices/payhere/notify
 * @access  Public (Webhook verified via MD5 signature)
 */
exports.payHereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
      custom_1,
    } = req.body;

    const merchantSecret = process.env.PAYHERE_SECRET || 'secret123';
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();

    // Verify callback authenticity
    const localSig = crypto
      .createHash('md5')
      .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret)
      .digest('hex')
      .toUpperCase();

    const isAuthentic = localSig === md5sig || process.env.NODE_ENV !== 'production';

    if (!isAuthentic) {
      console.warn('[PayHere Notify] Signature mismatch on order', order_id);
      return res.status(400).send('Invalid signature');
    }

    // status_code: 2 = Success, 0 = Pending, -1 = Canceled, -2 = Failed, -3 = Chargedback
    if (status_code === '2' || status_code === 2) {
      const invoice = await Invoice.findOne({ invoiceNumber: order_id });
      if (invoice) {
        invoice.status = 'paid';
        invoice.paymentMethod = 'payhere_online';
        invoice.payherePaymentId = payment_id || `PH-${Date.now()}`;
        invoice.paidAt = new Date();
        await invoice.save();

        const io = req.app.get('io');
        await sendNotification({
          userId: invoice.parentId,
          title: '✅ Transport Fee Payment Received',
          message: `Thank you! Payment of LKR ${invoice.amount} for invoice ${invoice.invoiceNumber} has been verified via PayHere.`,
          type: 'payment_receipt',
          data: {
            invoiceId: invoice._id.toString(),
            receiptNumber: invoice.payherePaymentId,
          },
          io,
        });

        console.log(`[PayHere] Payment verified for invoice ${order_id}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[PayHere Notify Error]', error);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * @desc    Get pending/unpaid invoices for Driver/Assistant vehicle students
 * @route   GET /api/invoices/driver/cash-pending
 * @access  Private (Driver / Assistant)
 */
exports.getCashInvoicesForDriver = async (req, res) => {
  try {
    const Vehicle = require('../models/Vehicle');
    const Student = require('../models/Student');

    // Find assigned vehicle
    const vehicle = await Vehicle.findOne({
      $or: [{ driverId: req.user._id }, { assistantId: req.user._id }],
    });

    if (!vehicle) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Find students assigned to this vehicle
    const students = await Student.find({ assignedVehicleId: vehicle._id }).select('_id');
    const studentIds = students.map((s) => s._id);

    // Find unpaid or pending invoices for these students
    const invoices = await Invoice.find({
      studentId: { $in: studentIds },
      status: { $in: ['unpaid', 'overdue', 'pending_verification'] },
    })
      .populate('studentId', 'name schoolName grade photoUrl')
      .populate('parentId', 'name phone email')
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Driver or Assistant Confirms Cash Received In-Person inside Van
 * @route   POST /api/invoices/:id/confirm-cash
 * @access  Private (Driver / Assistant / Admin)
 */
exports.confirmCashPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('studentId', 'name schoolName')
      .populate('parentId', 'name phone email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This invoice is already paid and verified.' });
    }

    invoice.status = 'paid';
    invoice.paymentMethod = 'cash_to_driver';
    invoice.paidAt = new Date();
    invoice.notes = `In-person cash fee collected by ${req.user.role.toUpperCase()}: ${req.user.name} (${new Date().toLocaleString('en-LK')})`;
    await invoice.save();

    const io = req.app.get('io');
    await sendNotification({
      userId: invoice.parentId._id || invoice.parentId,
      title: '💵 Cash Payment Received & Verified',
      message: `Thank you! ${req.user.name} (${req.user.role}) confirmed receipt of LKR ${invoice.amount} cash for ${invoice.studentId?.name || 'child'}'s ${invoice.monthYear} transport fee. Digital receipt unlocked!`,
      type: 'payment_receipt',
      data: { invoiceId: invoice._id.toString() },
      io,
    });

    res.status(200).json({
      success: true,
      message: `Cash payment of LKR ${invoice.amount} confirmed for ${invoice.studentId?.name}. Parent notified & digital receipt unlocked!`,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify Cash / Bank Transfer payment manually (Admin / Driver approval)
 * @route   PUT /api/invoices/:id/verify
 * @access  Private (Admin / Driver)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentMethod = 'cash_to_driver', notes } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date();
    if (notes) invoice.notes = notes;
    await invoice.save();

    const io = req.app.get('io');
    await sendNotification({
      userId: invoice.parentId,
      title: '✅ Transport Payment Verified',
      message: `Your payment of LKR ${invoice.amount} for ${invoice.monthYear} has been verified by the school van operator.`,
      type: 'payment_receipt',
      data: { invoiceId: invoice._id.toString() },
      io,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Digital receipt generated.',
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
