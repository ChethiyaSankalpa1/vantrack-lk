const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Trip = require('../models/Trip');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Incident = require('../models/Incident');
const AuditLog = require('../models/AuditLog');
const VehicleLocation = require('../models/VehicleLocation');
const { broadcastToTripParents } = require('../services/notificationService');

// Helper to log administrative actions
const createAudit = async (req, action, targetType, targetId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress || '',
    });
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
};

/**
 * @desc    Get Admin Dashboard Overview Stats
 * @route   GET /api/admin/overview
 * @access  Private (Admin)
 */
exports.getOverview = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const [
      totalStudents,
      totalParents,
      totalDrivers,
      totalAssistants,
      totalVehicles,
      scheduledTrips,
      activeTrips,
      completedTrips,
      delayedTrips,
      pendingInvoices,
      overdueInvoices,
      paidInvoicesMonth,
      activeIncidents,
      recentActivities,
      upcomingTrips,
    ] = await Promise.all([
      Student.countDocuments({ status: { $ne: 'inactive' } }),
      User.countDocuments({ role: 'parent', isActive: true }),
      User.countDocuments({ role: 'driver', isActive: true }),
      User.countDocuments({ role: 'assistant', isActive: true }),
      Vehicle.countDocuments(),
      Trip.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
        status: { $in: ['scheduled', 'assigned', 'ready'] },
      }),
      Trip.countDocuments({
        status: { $in: ['started', 'active'] },
      }),
      Trip.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
        status: 'completed',
      }),
      Trip.countDocuments({
        status: { $in: ['started', 'active'] },
        delayMinutes: { $gt: 0 },
      }),
      Invoice.countDocuments({ status: { $in: ['unpaid', 'pending_verification'] } }),
      Invoice.countDocuments({ status: 'overdue' }),
      Invoice.find({ monthYear: currentMonth, status: 'paid' }).select('amount'),
      Incident.find({ status: { $ne: 'resolved' } })
        .populate('vehicleId', 'registrationNumber makeModel')
        .populate('reportedBy', 'name phone')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      AuditLog.find()
        .populate('userId', 'name role email')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Trip.find({
        date: { $gte: todayStart },
        status: { $in: ['scheduled', 'assigned', 'ready', 'started', 'active'] },
      })
        .populate('routeId', 'name routeCode')
        .populate('vehicleId', 'registrationNumber')
        .populate('driverId', 'name phone')
        .sort({ date: 1, createdAt: 1 })
        .limit(6)
        .lean(),
    ]);

    const monthlyRevenue = paidInvoicesMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          students: totalStudents,
          parents: totalParents,
          drivers: totalDrivers,
          assistants: totalAssistants,
          vehicles: totalVehicles,
        },
        trips: {
          scheduled: scheduledTrips,
          active: activeTrips,
          completed: completedTrips,
          delayed: delayedTrips,
        },
        finances: {
          pendingInvoices,
          overdueInvoices,
          monthlyRevenue,
          currency: 'LKR',
          currentMonth,
        },
        activeIncidents,
        recentActivities,
        upcomingTrips,
      },
    });
  } catch (error) {
    console.error('[Admin Overview Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Analytics & Financial Trends
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
exports.getAnalytics = async (req, res) => {
  try {
    // Past 6 months revenue aggregation
    const monthlyRevenue = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$monthYear',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    // Trip completion breakdown
    const tripStatusCounts = await Trip.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Attendance breakdown for last 30 days
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Vehicle status distribution
    const vehicleStatusCounts = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlyRevenue,
        tripStatusCounts,
        attendanceStats,
        vehicleStatusCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get All Trips with Filtering & Search
 * @route   GET /api/admin/trips
 * @access  Private (Admin)
 */
exports.getTrips = async (req, res) => {
  try {
    const { status, date, routeId, vehicleId, driverId, tripType, limit = 50, page = 1 } = req.query;

    const query = {};
    if (status) {
      if (status === 'active') {
        query.status = { $in: ['started', 'active'] };
      } else {
        query.status = status;
      }
    }
    if (routeId) query.routeId = routeId;
    if (vehicleId) query.vehicleId = vehicleId;
    if (driverId) query.driverId = driverId;
    if (tripType) query.tripType = tripType;

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('routeId', 'name routeCode tripType')
        .populate('vehicleId', 'registrationNumber makeModel capacity status')
        .populate('driverId', 'name phone avatarUrl')
        .populate('assistantId', 'name phone')
        .populate('replacementVehicleId', 'registrationNumber makeModel')
        .populate('assignedStudents', 'name schoolName grade')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Trip.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: trips,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a New Scheduled Trip
 * @route   POST /api/admin/trips
 * @access  Private (Admin)
 */
exports.createTrip = async (req, res) => {
  try {
    const {
      routeId,
      vehicleId,
      driverId,
      assistantId,
      tripType,
      date,
      scheduledStartTime,
      scheduledEndTime,
      assignedStudents,
    } = req.body;

    if (!routeId || !vehicleId || !driverId || !tripType) {
      return res.status(400).json({
        success: false,
        message: 'Route, Vehicle, Driver, and Trip Type are required.',
      });
    }

    // Verify driver exists and has role driver
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ success: false, message: 'Invalid driver specified.' });
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle specified.' });
    }

    // Determine students if not explicitly provided: fetch active students on this vehicle/route
    let finalStudentIds = assignedStudents;
    if (!finalStudentIds || !Array.isArray(finalStudentIds) || finalStudentIds.length === 0) {
      const students = await Student.find({
        $or: [{ assignedVehicleId: vehicleId }, { assignedRouteId: routeId }],
        status: 'active',
      }).select('_id');
      finalStudentIds = students.map((s) => s._id);
    }

    const tripDate = date ? new Date(date) : new Date();

    const trip = await Trip.create({
      routeId,
      vehicleId,
      driverId,
      assistantId: assistantId || null,
      tripType,
      date: tripDate,
      status: 'scheduled',
      scheduledStartTime: scheduledStartTime || (tripType === 'morning_pickup' ? '06:30 AM' : '01:45 PM'),
      scheduledEndTime: scheduledEndTime || (tripType === 'morning_pickup' ? '08:00 AM' : '03:15 PM'),
      assignedStudents: finalStudentIds,
    });

    const populatedTrip = await Trip.findById(trip._id)
      .populate('routeId')
      .populate('vehicleId')
      .populate('driverId', 'name phone avatarUrl')
      .populate('assistantId', 'name phone')
      .populate('assignedStudents', 'name schoolName grade');

    await createAudit(req, 'TRIP_CREATED', 'Trip', trip._id, {
      routeId,
      vehicleId,
      driverId,
      tripType,
      date: tripDate,
      studentCount: finalStudentIds.length,
    });

    // Notify connected admin fleet room
    const io = req.app.get('io');
    if (io) {
      io.to('admin_fleet').emit('fleet:trip-created', populatedTrip);
    }

    res.status(201).json({
      success: true,
      message: 'Trip scheduled successfully.',
      data: populatedTrip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Detailed Trip Dossier
 * @route   GET /api/admin/trips/:id
 * @access  Private (Admin)
 */
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate({
        path: 'routeId',
        populate: { path: 'assignedVehicleId' },
      })
      .populate('vehicleId')
      .populate('driverId', 'name phone email licenseNumber avatarUrl address')
      .populate('assistantId', 'name phone email avatarUrl')
      .populate('replacementVehicleId')
      .populate({
        path: 'assignedStudents',
        populate: { path: 'parentId', select: 'name phone emergencyContact' },
      })
      .lean();

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Fetch live attendance for this trip
    const attendanceRecords = await Attendance.find({ tripId: trip._id })
      .populate('studentId', 'name photoUrl grade schoolName')
      .populate('recordedBy', 'name role')
      .lean();

    // Fetch incidents reported for this trip
    const incidents = await Incident.find({ tripId: trip._id })
      .populate('reportedBy', 'name role phone')
      .lean();

    // Fetch latest known GPS coordinate
    const latestLocation = await VehicleLocation.findOne({ tripId: trip._id })
      .sort({ timestamp: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        trip,
        attendanceRecords,
        incidents,
        latestLocation,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a Scheduled Trip
 * @route   PUT /api/admin/trips/:id
 * @access  Private (Admin)
 */
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    if (['completed', 'cancelled'].includes(trip.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a trip that is already ${trip.status}.`,
      });
    }

    const {
      routeId,
      vehicleId,
      driverId,
      assistantId,
      tripType,
      date,
      scheduledStartTime,
      scheduledEndTime,
      assignedStudents,
      status,
    } = req.body;

    if (routeId) trip.routeId = routeId;
    if (vehicleId) trip.vehicleId = vehicleId;
    if (driverId) trip.driverId = driverId;
    if (assistantId !== undefined) trip.assistantId = assistantId || null;
    if (tripType) trip.tripType = tripType;
    if (date) trip.date = new Date(date);
    if (scheduledStartTime) trip.scheduledStartTime = scheduledStartTime;
    if (scheduledEndTime) trip.scheduledEndTime = scheduledEndTime;
    if (assignedStudents) trip.assignedStudents = assignedStudents;
    if (status && ['scheduled', 'assigned', 'ready'].includes(status)) trip.status = status;

    await trip.save();

    await createAudit(req, 'TRIP_UPDATED', 'Trip', trip._id, req.body);

    const updated = await Trip.findById(trip._id)
      .populate('routeId')
      .populate('vehicleId')
      .populate('driverId', 'name phone')
      .populate('assistantId', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Trip updated successfully.',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel a Trip (with reason & parent notification)
 * @route   POST /api/admin/trips/:id/cancel
 * @access  Private (Admin)
 */
exports.cancelTrip = async (req, res) => {
  try {
    const { reason } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    if (trip.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already completed trip.' });
    }

    trip.status = 'cancelled';
    trip.cancellationReason = reason || 'Trip cancelled by transport authority.';
    trip.isGpsActive = false;
    await trip.save();

    // Release vehicle
    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: 'active',
      currentTripId: null,
    });

    await createAudit(req, 'TRIP_CANCELLED', 'Trip', trip._id, { reason });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip._id}`).emit('trip:cancelled', {
        tripId: trip._id,
        reason: trip.cancellationReason,
      });
      io.to('admin_fleet').emit('fleet:trip-cancelled', { tripId: trip._id });
    }

    // Broadcast notification to parents
    broadcastToTripParents({
      tripId: trip._id,
      title: '⚠️ School Van Trip Cancelled',
      message: `The transport trip has been cancelled: ${trip.cancellationReason}`,
      type: 'trip_start',
      data: { tripId: trip._id.toString() },
      io,
    }).catch((e) => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Trip cancelled and parents notified.',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Emergency Admin Start Trip Override
 * @route   POST /api/admin/trips/:id/start-override
 * @access  Private (Admin)
 */
exports.startTripOverride = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    if (['started', 'active'].includes(trip.status)) {
      return res.status(400).json({ success: false, message: 'Trip is already active.' });
    }

    if (trip.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Trip is already completed.' });
    }

    trip.status = 'started';
    trip.startedAt = new Date();
    trip.isGpsActive = true;
    trip.initiatedBy = req.user._id;
    await trip.save();

    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: 'in_trip',
      currentTripId: trip._id,
    });

    await createAudit(req, 'TRIP_START_OVERRIDE', 'Trip', trip._id, {
      initiatedByAdmin: req.user.name,
      startedAt: trip.startedAt,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip._id}`).emit('trip:started', {
        tripId: trip._id,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        startedAt: trip.startedAt,
      });
      io.to('admin_fleet').emit('fleet:trip-started', { tripId: trip._id });
    }

    broadcastToTripParents({
      tripId: trip._id,
      title: '🚌 School Van Trip Started (Admin Override)',
      message: `The school van trip has been initiated. Live tracking is active.`,
      type: 'trip_start',
      data: { tripId: trip._id.toString() },
      io,
    }).catch((e) => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Trip emergency start override applied successfully.',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Emergency Admin Terminate Trip Override
 * @route   POST /api/admin/trips/:id/terminate-override
 * @access  Private (Admin)
 */
exports.terminateTripOverride = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    trip.status = 'completed';
    trip.endedAt = new Date();
    trip.isGpsActive = false;
    await trip.save();

    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: 'active',
      currentTripId: null,
    });

    await createAudit(req, 'TRIP_END_OVERRIDE', 'Trip', trip._id, {
      terminatedByAdmin: req.user.name,
      endedAt: trip.endedAt,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip._id}`).emit('trip:ended', {
        tripId: trip._id,
        endedAt: trip.endedAt,
      });
      io.to('admin_fleet').emit('fleet:trip-ended', { tripId: trip._id });
    }

    res.status(200).json({
      success: true,
      message: 'Trip terminated by admin override.',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Reassign Vehicle to Trip (Breakdown replacement)
 * @route   POST /api/admin/trips/:id/reassign-vehicle
 * @access  Private (Admin)
 */
exports.reassignVehicle = async (req, res) => {
  try {
    const { newVehicleId, reason } = req.body;
    if (!newVehicleId) {
      return res.status(400).json({ success: false, message: 'New vehicle ID is required.' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    const newVehicle = await Vehicle.findById(newVehicleId);
    if (!newVehicle) {
      return res.status(404).json({ success: false, message: 'Replacement vehicle not found.' });
    }

    const oldVehicleId = trip.vehicleId;
    trip.replacementVehicleId = newVehicleId;
    trip.vehicleId = newVehicleId;
    if (reason) trip.emergencyNotes = `Vehicle replaced: ${reason}`;
    await trip.save();

    // Update vehicle statuses
    await Vehicle.findByIdAndUpdate(oldVehicleId, { status: 'maintenance', currentTripId: null });
    await Vehicle.findByIdAndUpdate(newVehicleId, { status: 'in_trip', currentTripId: trip._id });

    await createAudit(req, 'VEHICLE_REASSIGNED', 'Trip', trip._id, {
      oldVehicleId,
      newVehicleId,
      reason,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip._id}`).emit('trip:vehicle-reassigned', {
        tripId: trip._id,
        newVehicle: newVehicle.registrationNumber,
        reason,
      });
    }

    broadcastToTripParents({
      tripId: trip._id,
      title: '🚐 Replacement Vehicle Assigned',
      message: `Your school van has been switched to ${newVehicle.registrationNumber} (${newVehicle.makeModel}). Reason: ${reason || 'Technical reassignment'}.`,
      type: 'delay',
      data: { tripId: trip._id.toString() },
      io,
    }).catch((e) => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Replacement vehicle assigned successfully.',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Live Fleet Telemetry for Admin Map
 * @route   GET /api/admin/fleet/live
 * @access  Private (Admin)
 */
exports.getLiveFleet = async (req, res) => {
  try {
    // Find all trips currently in progress
    const activeTrips = await Trip.find({
      status: { $in: ['started', 'active'] },
    })
      .populate('vehicleId', 'registrationNumber makeModel capacity status color')
      .populate('driverId', 'name phone avatarUrl')
      .populate('routeId', 'name routeCode stops startLocation endLocation')
      .lean();

    const liveFleet = await Promise.all(
      activeTrips.map(async (trip) => {
        // Query latest GPS position
        const latestLocation = await VehicleLocation.findOne({
          $or: [{ tripId: trip._id }, { vehicleId: trip.vehicleId?._id }],
        })
          .sort({ timestamp: -1 })
          .lean();

        // Attendance counts
        const attendance = await Attendance.aggregate([
          { $match: { tripId: trip._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const attendanceCounts = {
          boarded: 0,
          dropped_off: 0,
          absent: 0,
        };
        attendance.forEach((item) => {
          if (attendanceCounts[item._id] !== undefined) {
            attendanceCounts[item._id] = item.count;
          }
        });

        // Any active incident on this trip
        const incident = await Incident.findOne({
          tripId: trip._id,
          status: { $ne: 'resolved' },
        })
          .sort({ createdAt: -1 })
          .lean();

        return {
          tripId: trip._id,
          tripType: trip.tripType,
          status: trip.status,
          startedAt: trip.startedAt,
          delayMinutes: trip.delayMinutes || 0,
          delayReason: trip.delayReason || '',
          currentStopIndex: trip.currentStopIndex || 0,
          vehicle: trip.vehicleId,
          driver: trip.driverId,
          route: trip.routeId,
          attendanceCounts,
          activeIncident: incident || null,
          location: latestLocation
            ? {
                latitude: latestLocation.latitude,
                longitude: latestLocation.longitude,
                speed: latestLocation.speed || 0,
                heading: latestLocation.heading || 0,
                timestamp: latestLocation.timestamp,
              }
            : {
                // Colombo fallback if no GPS emitted yet
                latitude: 6.9271,
                longitude: 79.8612,
                speed: 0,
                heading: 0,
                timestamp: new Date(),
              },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: liveFleet.length,
      data: liveFleet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Students List
 * @route   GET /api/admin/students
 * @access  Private (Admin)
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, routeId, vehicleId, status } = req.query;
    const query = {};

    if (status) query.status = status;
    if (routeId) query.assignedRouteId = routeId;
    if (vehicleId) query.assignedVehicleId = vehicleId;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { schoolName: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await Student.find(query)
      .populate('parentId', 'name phone email emergencyContact')
      .populate('assignedVehicleId', 'registrationNumber makeModel')
      .populate('assignedRouteId', 'name routeCode')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create Student with Parent & Route Assignment
 * @route   POST /api/admin/students
 * @access  Private (Admin)
 */
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      admissionNumber,
      schoolName,
      grade,
      parentId,
      assignedVehicleId,
      assignedRouteId,
      pickupLocation,
      dropoffLocation,
      monthlyFee,
    } = req.body;

    if (!name || !schoolName || !grade || !parentId) {
      return res.status(400).json({
        success: false,
        message: 'Student name, school name, grade, and parent ID are required.',
      });
    }

    // Generate unique QR string
    const qrCodeString = `VANTRK-STU-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const student = await Student.create({
      name,
      admissionNumber: admissionNumber || '',
      schoolName,
      grade,
      parentId,
      assignedVehicleId: assignedVehicleId || null,
      assignedRouteId: assignedRouteId || null,
      pickupLocation: pickupLocation || { latitude: 6.848, longitude: 79.926, scheduledTime: '06:45 AM' },
      dropoffLocation: dropoffLocation || { latitude: 6.848, longitude: 79.926, scheduledTime: '02:15 PM' },
      qrCodeString,
      monthlyFee: monthlyFee || 7500,
    });

    await createAudit(req, 'STUDENT_CREATED', 'Student', student._id, { name, schoolName, parentId });

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully.',
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Student
 * @route   PUT /api/admin/students/:id
 * @access  Private (Admin)
 */
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('parentId', 'name phone')
      .populate('assignedVehicleId', 'registrationNumber')
      .populate('assignedRouteId', 'name');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    await createAudit(req, 'STUDENT_UPDATED', 'Student', student._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Parents List with Associated Children
 * @route   GET /api/admin/parents
 * @access  Private (Admin)
 */
exports.getParents = async (req, res) => {
  try {
    const parents = await User.find({ role: 'parent' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const parentIds = parents.map((p) => p._id);
    const students = await Student.find({ parentId: { $in: parentIds } }).lean();

    const parentsWithChildren = parents.map((parent) => ({
      ...parent,
      children: students.filter((s) => s.parentId.toString() === parent._id.toString()),
    }));

    res.status(200).json({
      success: true,
      count: parentsWithChildren.length,
      data: parentsWithChildren,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Register a Parent Account
 * @route   POST /api/admin/parents
 * @access  Private (Admin)
 */
exports.createParent = async (req, res) => {
  try {
    const { name, email, phone, password, address, emergencyContact, nicNumber } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, email, and phone are required.' });
    }

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email or phone already registered.' });
    }

    const parent = await User.create({
      name,
      email,
      phone,
      password: password || 'password123',
      role: 'parent',
      address: address || '',
      emergencyContact: emergencyContact || '',
      nicNumber: nicNumber || '',
    });

    await createAudit(req, 'USER_CREATED', 'User', parent._id, { role: 'parent', email });

    res.status(201).json({
      success: true,
      message: 'Parent registered successfully.',
      data: {
        id: parent._id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle User Active Status (Deactivate / Reactivate)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin)
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save();

    await createAudit(req, 'USER_STATUS_TOGGLED', 'User', user._id, { isActive: user.isActive });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Drivers & Assistants List
 * @route   GET /api/admin/drivers
 * @access  Private (Admin)
 */
exports.getDrivers = async (req, res) => {
  try {
    const crew = await User.find({ role: { $in: ['driver', 'assistant'] } })
      .select('-password')
      .populate('assignedVehicleId', 'registrationNumber makeModel')
      .sort({ role: 1, name: 1 })
      .lean();

    // Query all vehicles to ensure crew linked via vehicle.driverId or vehicle.assistantId are reflected
    const vehicles = await Vehicle.find({
      $or: [
        { driverId: { $in: crew.map((c) => c._id) } },
        { assistantId: { $in: crew.map((c) => c._id) } },
      ],
    })
      .select('registrationNumber makeModel driverId assistantId')
      .lean();

    const populatedCrew = crew.map((member) => {
      if (!member.assignedVehicleId) {
        const matchedVeh = vehicles.find(
          (v) =>
            (v.driverId && v.driverId.toString() === member._id.toString()) ||
            (v.assistantId && v.assistantId.toString() === member._id.toString())
        );
        if (matchedVeh) {
          member.assignedVehicleId = {
            _id: matchedVeh._id,
            registrationNumber: matchedVeh.registrationNumber,
            makeModel: matchedVeh.makeModel,
          };
        }
      }
      return member;
    });

    res.status(200).json({
      success: true,
      count: populatedCrew.length,
      data: populatedCrew,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Assign Vehicle to Driver or Assistant
 * @route   PUT /api/admin/drivers/:id/assign-vehicle
 * @access  Private (Admin)
 */
exports.assignCrewVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const crewMember = await User.findById(req.params.id);
    if (!crewMember) {
      return res.status(404).json({ success: false, message: 'Crew member not found.' });
    }

    // If unassigning
    if (!vehicleId) {
      if (crewMember.assignedVehicleId) {
        if (crewMember.role === 'assistant') {
          await Vehicle.findByIdAndUpdate(crewMember.assignedVehicleId, { assistantId: null });
        } else if (crewMember.role === 'driver') {
          await Vehicle.findByIdAndUpdate(crewMember.assignedVehicleId, { driverId: null });
        }
      }
      crewMember.assignedVehicleId = null;
      await crewMember.save();

      await createAudit(req, 'CREW_VEHICLE_UNASSIGNED', 'User', crewMember._id, {
        crewName: crewMember.name,
        role: crewMember.role,
      });

      return res.status(200).json({
        success: true,
        message: `${crewMember.name} has been unassigned from vehicle.`,
        data: crewMember,
      });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    // If changing from old vehicle, clear old vehicle's link
    if (crewMember.assignedVehicleId && crewMember.assignedVehicleId.toString() !== vehicleId) {
      if (crewMember.role === 'assistant') {
        await Vehicle.findByIdAndUpdate(crewMember.assignedVehicleId, { assistantId: null });
      } else if (crewMember.role === 'driver') {
        await Vehicle.findByIdAndUpdate(crewMember.assignedVehicleId, { driverId: null });
      }
    }

    // Set on user
    crewMember.assignedVehicleId = vehicle._id;
    await crewMember.save();

    // Set on vehicle
    if (crewMember.role === 'assistant') {
      // Clear previous assistant's assignedVehicleId if another assistant was assigned
      if (vehicle.assistantId && vehicle.assistantId.toString() !== crewMember._id.toString()) {
        await User.findByIdAndUpdate(vehicle.assistantId, { assignedVehicleId: null });
      }
      vehicle.assistantId = crewMember._id;
      await vehicle.save();
    } else if (crewMember.role === 'driver') {
      if (vehicle.driverId && vehicle.driverId.toString() !== crewMember._id.toString()) {
        await User.findByIdAndUpdate(vehicle.driverId, { assignedVehicleId: null });
      }
      vehicle.driverId = crewMember._id;
      await vehicle.save();
    }

    await createAudit(req, 'CREW_VEHICLE_ASSIGNED', 'User', crewMember._id, {
      crewName: crewMember.name,
      role: crewMember.role,
      vehicleId: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
    });

    res.status(200).json({
      success: true,
      message: `${crewMember.name} (${crewMember.role}) successfully assigned to vehicle ${vehicle.registrationNumber}.`,
      data: crewMember,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create Driver or Assistant
 * @route   POST /api/admin/drivers
 * @access  Private (Admin)
 */
exports.createDriver = async (req, res) => {
  try {
    const { name, email, phone, role, licenseNumber, nicNumber, address, assignedVehicleId } = req.body;

    if (!name || !email || !phone || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and role are required.' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password: 'password123',
      role,
      licenseNumber: licenseNumber || '',
      nicNumber: nicNumber || '',
      address: address || '',
      assignedVehicleId: assignedVehicleId || null,
    });

    await createAudit(req, 'CREW_CREATED', 'User', user._id, { role, name });

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} registered successfully.`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Vehicles List
 * @route   GET /api/admin/vehicles
 * @access  Private (Admin)
 */
exports.getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate('driverId', 'name phone avatarUrl')
      .populate('assistantId', 'name phone')
      .populate('currentTripId', 'status tripType')
      .sort({ registrationNumber: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create Vehicle
 * @route   POST /api/admin/vehicles
 * @access  Private (Admin)
 */
exports.createVehicle = async (req, res) => {
  try {
    const { registrationNumber, makeModel, capacity, color, driverId, assistantId } = req.body;

    if (!registrationNumber) {
      return res.status(400).json({ success: false, message: 'Registration number is required.' });
    }

    const vehicle = await Vehicle.create({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      makeModel: makeModel || 'Toyota HiAce KDH 200',
      capacity: capacity || 16,
      color: color || 'School Yellow / White',
      driverId: driverId || null,
      assistantId: assistantId || null,
    });

    if (driverId) {
      await User.findByIdAndUpdate(driverId, { assignedVehicleId: vehicle._id });
    }
    if (assistantId) {
      await User.findByIdAndUpdate(assistantId, { assignedVehicleId: vehicle._id });
    }

    await createAudit(req, 'VEHICLE_CREATED', 'Vehicle', vehicle._id, { registrationNumber });

    res.status(201).json({
      success: true,
      message: 'Vehicle added to fleet.',
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Vehicle
 * @route   PUT /api/admin/vehicles/:id
 * @access  Private (Admin)
 */
exports.updateVehicle = async (req, res) => {
  try {
    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) return res.status(404).json({ success: false, message: 'Vehicle not found.' });

    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('driverId', 'name phone')
      .populate('assistantId', 'name phone');

    // Sync driver assignedVehicleId
    if (req.body.driverId !== undefined) {
      if (existingVehicle.driverId && existingVehicle.driverId.toString() !== req.body.driverId) {
        await User.findByIdAndUpdate(existingVehicle.driverId, { assignedVehicleId: null });
      }
      if (req.body.driverId) {
        await User.findByIdAndUpdate(req.body.driverId, { assignedVehicleId: vehicle._id });
      }
    }

    // Sync assistant assignedVehicleId
    if (req.body.assistantId !== undefined) {
      if (existingVehicle.assistantId && existingVehicle.assistantId.toString() !== req.body.assistantId) {
        await User.findByIdAndUpdate(existingVehicle.assistantId, { assignedVehicleId: null });
      }
      if (req.body.assistantId) {
        await User.findByIdAndUpdate(req.body.assistantId, { assignedVehicleId: vehicle._id });
      }
    }

    await createAudit(req, 'VEHICLE_UPDATED', 'Vehicle', vehicle._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Vehicle details updated.',
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Attendance Logs with Filtering
 * @route   GET /api/admin/attendance
 * @access  Private (Admin)
 */
exports.getAttendanceLogs = async (req, res) => {
  try {
    const { tripId, studentId, status, date, limit = 50, page = 1 } = req.query;
    const query = {};

    if (tripId) query.tripId = tripId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      query.timestamp = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      Attendance.find(query)
        .populate('studentId', 'name admissionNumber grade schoolName')
        .populate('recordedBy', 'name role')
        .populate({
          path: 'tripId',
          select: 'tripType date status routeId',
          populate: { path: 'routeId', select: 'name routeCode' },
        })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Attendance.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Invoices List
 * @route   GET /api/admin/invoices
 * @access  Private (Admin)
 */
exports.getInvoices = async (req, res) => {
  try {
    const { status, monthYear, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (monthYear) query.monthYear = monthYear;

    const invoices = await Invoice.find(query)
      .populate('parentId', 'name phone email')
      .populate('studentId', 'name grade schoolName')
      .sort({ createdAt: -1 })
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
 * @desc    Bulk Generate Monthly Invoices for All Active Students
 * @route   POST /api/admin/invoices/bulk-generate
 * @access  Private (Admin)
 */
exports.generateMonthlyInvoices = async (req, res) => {
  try {
    const { monthYear, dueDate, defaultAmount = 7500 } = req.body;

    if (!monthYear) {
      return res.status(400).json({ success: false, message: 'Month-Year (e.g., 2026-11) is required.' });
    }

    const targetDueDate = dueDate ? new Date(dueDate) : new Date(new Date().setDate(new Date().getDate() + 15));

    // Find all active students
    const activeStudents = await Student.find({ status: 'active' }).populate('parentId');

    let createdCount = 0;
    let skippedCount = 0;

    for (const student of activeStudents) {
      if (!student.parentId) {
        skippedCount++;
        continue;
      }

      // Check if invoice already exists for this student & month
      const existing = await Invoice.findOne({
        studentId: student._id,
        monthYear,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const invoiceNumber = `INV-${monthYear.replace('-', '')}-${student._id.toString().slice(-4).toUpperCase()}`;

      await Invoice.create({
        invoiceNumber,
        parentId: student.parentId._id,
        studentId: student._id,
        monthYear,
        amount: student.monthlyFee || defaultAmount,
        currency: 'LKR',
        dueDate: targetDueDate,
        status: 'unpaid',
      });

      createdCount++;
    }

    await createAudit(req, 'BULK_INVOICES_GENERATED', 'Invoice', null, {
      monthYear,
      createdCount,
      skippedCount,
    });

    res.status(201).json({
      success: true,
      message: `Generated ${createdCount} invoices for ${monthYear}. (${skippedCount} already existed or skipped)`,
      createdCount,
      skippedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify Payment Status (Bank Slip or Manual Cash)
 * @route   POST /api/admin/invoices/:id/verify
 * @access  Private (Admin)
 */
exports.verifyInvoicePayment = async (req, res) => {
  try {
    const { paymentMethod = 'bank_transfer', notes = 'Verified by transport authority' } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    invoice.status = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAt = new Date();
    invoice.notes = notes;
    await invoice.save();

    await createAudit(req, 'PAYMENT_VERIFIED', 'Invoice', invoice._id, {
      amount: invoice.amount,
      paymentMethod,
      invoiceNumber: invoice.invoiceNumber,
    });

    res.status(200).json({
      success: true,
      message: 'Payment marked as verified and paid.',
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get All Incidents
 * @route   GET /api/admin/incidents
 * @access  Private (Admin)
 */
exports.getIncidents = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const incidents = await Incident.find(query)
      .populate('vehicleId', 'registrationNumber makeModel')
      .populate('reportedBy', 'name role phone')
      .populate('tripId', 'tripType date status')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Resolve Incident
 * @route   PUT /api/admin/incidents/:id/resolve
 * @access  Private (Admin)
 */
exports.resolveIncident = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    if (resolutionNotes) {
      incident.description = `${incident.description}\n[Resolution]: ${resolutionNotes}`;
    }
    await incident.save();

    await createAudit(req, 'INCIDENT_RESOLVED', 'Incident', incident._id, { resolutionNotes });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${incident.tripId}`).emit('incident:resolved', {
        incidentId: incident._id,
        tripId: incident.tripId,
      });
      io.to('admin_fleet').emit('fleet:incident-resolved', { incidentId: incident._id });
    }

    res.status(200).json({
      success: true,
      message: 'Incident resolved.',
      data: incident,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Security Audit Logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const query = {};

    if (action) query.action = action;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
