const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  getDriverDashboard,
  startTrip,
  endTrip,
  updateLocation,
  getAssignedStudents,
  reportIncident,
  getTripHistory,
  updateCurrentStop,
} = require('../controllers/driverController');

router.get('/dashboard', protect, authorize('driver', 'assistant'), getDriverDashboard);
router.get('/students', protect, authorize('driver', 'assistant'), getAssignedStudents);
router.get('/trips', protect, authorize('driver'), getTripHistory);
router.post('/trips/:id/start', protect, authorize('driver'), startTrip);
router.post('/trips/:id/end', protect, authorize('driver'), endTrip);
router.put('/trips/:id/stop', protect, authorize('driver', 'assistant'), updateCurrentStop);
router.post('/location', protect, authorize('driver', 'assistant'), updateLocation);
router.post('/incidents', protect, authorize('driver', 'assistant'), reportIncident);

module.exports = router;
