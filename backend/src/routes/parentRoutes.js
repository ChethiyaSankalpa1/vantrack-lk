const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getParentDashboard,
  getLiveTrip,
  getTripHistory,
} = require('../controllers/parentController');

router.get('/dashboard', protect, authorize('parent'), getParentDashboard);
router.get('/live-trip', protect, authorize('parent'), getLiveTrip);
router.get('/trip-history', protect, authorize('parent'), getTripHistory);

module.exports = router;
