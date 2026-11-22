const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getInvoices,
  getInvoiceById,
  uploadReceipt,
  initiatePayHere,
  payHereNotify,
  payHereReturn,
  payHereCancel,
  renderPayHereCheckoutPage,
  verifyPayment,
  getCashInvoicesForDriver,
  confirmCashPayment,
  seedTestUnpaidInvoices,
} = require('../controllers/invoiceController');

const bankDepositController = require('../controllers/bankDepositController');

// PayHere Webhook & browser-facing pages (Public)
router.post('/payhere/notify', payHereNotify);
router.get('/payhere/checkout-page/:invoiceId', renderPayHereCheckoutPage);
router.get('/payhere/return', payHereReturn);
router.get('/payhere/cancel', payHereCancel);

// Seed due unpaid test invoice for parent testing
router.post('/seed-due', protect, seedTestUnpaidInvoices);

// Driver & Assistant Cash Collection endpoints
router.get('/driver/cash-pending', protect, authorize('driver', 'assistant'), getCashInvoicesForDriver);
router.post('/:id/confirm-cash', protect, authorize('driver', 'assistant', 'admin'), confirmCashPayment);

// Protected routes
router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/:id/receipt', protect, authorize('parent'), uploadReceipt);
router.post('/:id/bank-deposit', protect, authorize('parent'), bankDepositController.submitBankDeposit);
router.post('/:id/payhere-checkout', protect, authorize('parent'), initiatePayHere);
router.put('/:id/verify', protect, authorize('admin'), verifyPayment);

module.exports = router;
