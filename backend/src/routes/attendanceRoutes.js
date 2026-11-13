const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  recordAttendance,
  qrScanAttendance,
  getTripAttendance,
  getStudentAttendance,
} = require('../controllers/attendanceController');

router.post('/', protect, authorize('driver', 'assistant'), recordAttendance);
router.post('/qr-scan', protect, authorize('driver', 'assistant'), qrScanAttendance);
router.post('/scan-qr', protect, authorize('driver', 'assistant'), qrScanAttendance);
router.get('/trip/:tripId', protect, getTripAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);

module.exports = router;
