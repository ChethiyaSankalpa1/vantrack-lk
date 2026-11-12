const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getInvoices,
  getInvoiceById,
  uploadReceipt,
  initiatePayHere,
  payHereNotify,
  verifyPayment,
} = require('../controllers/invoiceController');

// PayHere Webhook (Public, verified with MD5 signature)
router.post('/payhere/notify', payHereNotify);

// Protected routes
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/:id/receipt', protect, authorize('parent'), uploadReceipt);
router.post('/:id/payhere-checkout', protect, authorize('parent'), initiatePayHere);
router.put('/:id/verify', protect, authorize('admin', 'driver'), verifyPayment);

module.exports = router;
