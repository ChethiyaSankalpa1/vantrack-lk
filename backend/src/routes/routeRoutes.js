const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const Vehicle = require('../models/Vehicle');

// Get route details with stops
router.get('/:id', protect, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id).populate('assignedVehicleId');
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.status(200).json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all routes (admin/driver)
router.get('/', protect, async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true }).populate('assignedVehicleId', 'registrationNumber makeModel');
    res.status(200).json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new trip for a route (driver starts scheduling)
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

// Get latest GPS location for a trip
router.get('/trips/:tripId/location', protect, async (req, res) => {
  try {
    const VehicleLocation = require('../models/VehicleLocation');
    const location = await VehicleLocation.findOne({ tripId: req.params.tripId })
      .sort({ recordedAt: -1 });
    res.status(200).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
