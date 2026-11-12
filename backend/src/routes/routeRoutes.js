const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const routeController = require('../controllers/routeController');
const Trip = require('../models/Trip');

// Route Querying (Admin, Driver, Assistant, Parent)
router.get('/', protect, routeController.getAllRoutes);
router.get('/:id', protect, routeController.getRouteById);

// Route Management (Admin Only)
router.post('/', protect, authorize('admin'), routeController.createRoute);
router.put('/:id', protect, authorize('admin'), routeController.updateRoute);
router.patch('/:id/status', protect, authorize('admin'), routeController.toggleRouteStatus);
router.delete('/:id', protect, authorize('admin'), routeController.deleteRoute);

// Legacy / Existing helper endpoints preserved for compatibility
router.post('/trips', protect, async (req, res) => {
  try {
    const { routeId, vehicleId, tripType } = req.body;
    const trip = await Trip.create({
      routeId,
      vehicleId,
      driverId: req.user._id,
      tripType,
      date: new Date(),
      status: 'scheduled',
    });
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/trips/:tripId/location', protect, async (req, res) => {
  try {
    const VehicleLocation = require('../models/VehicleLocation');
    const location = await VehicleLocation.findOne({ tripId: req.params.tripId }).sort({ recordedAt: -1 });
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
