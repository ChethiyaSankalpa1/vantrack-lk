const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Incident = require('../models/Incident');
const VehicleLocation = require('../models/VehicleLocation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { broadcastToTripParents } = require('../services/notificationService');

/**
 * @desc    Get driver dashboard data (assigned vehicle, today's trips, students)
 * @route   GET /api/driver/dashboard
 * @access  Private (Driver only)
 */
exports.getDriverDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAssistant = req.user.role === 'assistant';

    // Find assigned vehicle (supports both driver and assistant roles)
    const vehicleQuery = isAssistant
      ? { $or: [{ assistantId: userId }, { _id: req.user.assignedVehicleId }] }
      : { $or: [{ driverId: userId }, { _id: req.user.assignedVehicleId }] };

    const vehicle = await Vehicle.findOne(vehicleQuery)
      .populate('driverId', 'name phone avatarUrl licenseNumber')
      .populate('assistantId', 'name phone avatarUrl')
      .lean();

    if (!vehicle) {
      return res.status(200).json({
        success: true,
        data: {
          vehicle: null,
          activeTrip: null,
          todayTrips: [],
          message: 'No vehicle assigned yet. Contact your fleet administrator.',
        },
      });
    }

    // Find assigned route
    const route = await Route.findOne({ assignedVehicleId: vehicle._id }).lean();

    // Find today's trips
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const tripQuery = {
      date: { $gte: startOfToday, $lte: endOfToday },
    };

    if (isAssistant) {
      tripQuery.$or = [{ assistantId: userId }, { vehicleId: vehicle._id }];
    } else {
      tripQuery.$or = [{ driverId: userId }, { vehicleId: vehicle._id }];
    }

    const todayTrips = await Trip.find(tripQuery)
      .populate('routeId')
      .sort({ createdAt: 1 })
      .lean();

    // Active trip (started or active)
    const activeTrip = todayTrips.find((t) => t.status === 'started' || t.status === 'active') || null;

    // Student list for active/scheduled trips
    let assignedStudents = [];
    if (vehicle._id) {
      assignedStudents = await Student.find({
        assignedVehicleId: vehicle._id,
        status: 'active',
      })
        .populate('parentId', 'name phone emergencyContact')
        .lean();
    }

    // Attendance for active trip
    let tripAttendance = [];
    if (activeTrip) {
      tripAttendance = await Attendance.find({ tripId: activeTrip._id })
        .populate('studentId', 'name photoUrl grade schoolName')
        .lean();
    }

    // Fetch today's absence reports for these students
    const AbsenceReport = require('../models/AbsenceReport');
    const studentIds = assignedStudents.map((s) => s._id);
    const todayAbsences = await AbsenceReport.find({
      studentId: { $in: studentIds },
      absenceDate: { $gte: startOfToday, $lte: endOfToday },
      status: { $in: ['submitted', 'ACKNOWLEDGED'] },
    }).lean();

    // Attach absence report object to each assigned student
    assignedStudents = assignedStudents.map((student) => {
      const abs = todayAbsences.find((a) => a.studentId.toString() === student._id.toString());
      return {
        ...student,
        todayAbsence: abs || null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        driver: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          avatarUrl: req.user.avatarUrl,
          licenseNumber: req.user.licenseNumber,
        },
        vehicle,
        route,
        todayTrips,
        activeTrip,
        assignedStudents,
        tripAttendance,
        todayAbsences,
      },
    });
  } catch (error) {
    console.error('[Driver Dashboard Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Start a trip
 * @route   POST /api/driver/trips/:id/start
 * @access  Private (Driver)
 */
exports.startTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this trip' });
    }

    if (trip.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot start a cancelled trip.' });
    }

    if (trip.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Trip is already completed.' });
    }

    if (trip.status === 'started' || trip.status === 'active') {
      return res.status(400).json({ success: false, message: 'Trip is already in progress.' });
    }

    // Prevent duplicate active trips by the same driver
    const existingActiveTrip = await Trip.findOne({
      driverId: req.user._id,
      status: { $in: ['started', 'active'] },
      _id: { $ne: trip._id },
    });
    if (existingActiveTrip) {
      return res.status(400).json({
        success: false,
        message: 'You already have another active trip in progress. Please complete or end it first.',
      });
    }

    trip.status = 'started';
    trip.startedAt = new Date();
    trip.isGpsActive = true;
    trip.initiatedBy = req.user._id;
    await trip.save();

    // If initial GPS coordinates provided, record them
    const { latitude, longitude, speed = 0, heading = 0 } = req.body;
    if (latitude && longitude) {
      await VehicleLocation.create({
        vehicleId: trip.vehicleId,
        tripId: trip._id,
        driverId: req.user._id,
        latitude,
        longitude,
        speed,
        heading,
        accuracy: 5,
        recordedAt: trip.startedAt,
      });
    }

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: 'in_trip',
      currentTripId: trip._id,
    });

    // Real-time broadcast
    const io = req.app.get('io');
    if (io) {
      const startPayload = {
        tripId: trip._id,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        startedAt: trip.startedAt,
      };
      io.emit('trip:started', startPayload);
      io.to('admin_fleet').emit('fleet:trip-started', startPayload);
      io.emit('fleet:trip-started', startPayload);
    }

    // Push notification to all parents on this trip
    broadcastToTripParents({
      tripId: trip._id,
      title: '🚌 School Van Trip Started',
      message: `The school van journey has commenced. Live GPS tracking is now active.`,
      type: 'trip_start',
      data: { tripId: trip._id.toString() },
      io,
    }).catch((e) => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Trip started. GPS sharing is now active.',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    End a trip
 * @route   POST /api/driver/trips/:id/end
 * @access  Private (Driver)
 */
exports.endTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    if (trip.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this trip' });
    }

    if (trip.status !== 'started' && trip.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Trip is not currently active' });
    }

    trip.status = 'completed';
    trip.endedAt = new Date();
    trip.isGpsActive = false;
    await trip.save();

    // Update vehicle back to active
    await Vehicle.findByIdAndUpdate(trip.vehicleId, {
      status: 'active',
      currentTripId: null,
    });

    const io = req.app.get('io');
    if (io) {
      const endPayload = {
        tripId: trip._id,
        vehicleId: trip.vehicleId,
        endedAt: trip.endedAt,
      };
      io.emit('trip:completed', endPayload);
      io.to('admin_fleet').emit('fleet:trip-ended', endPayload);
      io.emit('fleet:trip-ended', endPayload);
    }

    // Push notification to all parents
    broadcastToTripParents({
      tripId: trip._id,
      title: '🏁 School Van Trip Completed',
      message: `The school transportation trip has safely finished.`,
      type: 'general',
      data: { tripId: trip._id.toString() },
      io,
    }).catch((e) => console.error(e));

    res.status(200).json({
      success: true,
      message: 'Trip completed. GPS sharing stopped.',
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update driver GPS location during active trip
 * @route   POST /api/driver/location
 * @access  Private (Driver / Assistant)
 */
exports.updateLocation = async (req, res) => {
  try {
    const { tripId, vehicleId, latitude, longitude, speed = 0, heading = 0, accuracy = 5 } = req.body;

    if (!tripId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'tripId, latitude and longitude are required',
      });
    }

    const trip = await Trip.findById(tripId);
    if (!trip || (trip.status !== 'started' && trip.status !== 'active')) {
      return res.status(400).json({
        success: false,
        message: 'No active trip found. GPS update rejected.',
      });
    }

    // Security check: verify sender is driver or assistant on this trip
    const isDriver = trip.driverId && trip.driverId.toString() === req.user._id.toString();
    const isAssistant = trip.assistantId && trip.assistantId.toString() === req.user._id.toString();
    if (!isDriver && !isAssistant) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to broadcast location for this trip.',
      });
    }

    // Store location record
    const location = await VehicleLocation.create({
      vehicleId: vehicleId || trip.vehicleId,
      tripId,
      driverId: req.user._id,
      latitude,
      longitude,
      speed,
      heading,
      accuracy,
      recordedAt: new Date(),
    });

    // Real-time broadcast to parents and Admin Live Fleet
    const io = req.app.get('io');
    if (io) {
      const locationPayload = {
        tripId,
        vehicleId: vehicleId || trip.vehicleId,
        latitude,
        longitude,
        speed,
        heading,
        accuracy,
        timestamp: location.recordedAt,
      };
      // Parents listening on trip room
      io.to(`trip_${tripId}`).emit('trip:location-changed', locationPayload);
      // Admin dashboard listening on admin_fleet room
      io.to('admin_fleet').emit('fleet:vehicle-moved', locationPayload);
      // Fallback global emit for admin monitoring
      io.emit('fleet:vehicle-moved', locationPayload);
    }

    res.status(200).json({
      success: true,
      message: 'Location updated and broadcast to parents & admin',
      data: {
        latitude,
        longitude,
        speed,
        timestamp: location.recordedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get student list for driver's current vehicle
 * @route   GET /api/driver/students
 * @access  Private (Driver / Assistant)
 */
exports.getAssignedStudents = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAssistant = req.user.role === 'assistant';
    const vehicleQuery = isAssistant
      ? { $or: [{ assistantId: userId }, { _id: req.user.assignedVehicleId }] }
      : { $or: [{ driverId: userId }, { _id: req.user.assignedVehicleId }] };
    const vehicle = await Vehicle.findOne(vehicleQuery);
    const vehicleId = vehicle?._id || req.query.vehicleId;

    if (!vehicleId) {
      return res.status(404).json({ success: false, message: 'No vehicle assigned' });
    }

    const students = await Student.find({ assignedVehicleId: vehicleId, status: 'active' })
      .populate('parentId', 'name phone emergencyContact')
      .sort({ name: 1 });

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
 * @desc    Report an incident (delay, breakdown, route change)
 * @route   POST /api/driver/incidents
 * @access  Private (Driver / Assistant)
 */
exports.reportIncident = async (req, res) => {
  try {
    const { tripId, vehicleId, type, title, description, estimatedDelayMinutes, photoUrl } = req.body;

    const incident = await Incident.create({
      tripId,
      vehicleId,
      reportedBy: req.user._id,
      type,
      title,
      description,
      estimatedDelayMinutes: estimatedDelayMinutes || 15,
      photoUrl: photoUrl || '',
    });

    // Update trip delay
    if (tripId && estimatedDelayMinutes) {
      await Trip.findByIdAndUpdate(tripId, {
        delayMinutes: estimatedDelayMinutes,
        delayReason: description,
      });
    }

    // Broadcast to parents in real-time
    const io = req.app.get('io');
    if (io && tripId) {
      io.to(`trip_${tripId}`).emit('trip:incident', {
        tripId,
        type,
        title,
        description,
        estimatedDelayMinutes,
        reportedAt: incident.createdAt,
      });

      // Broadcast to Admin fleet room
      io.to('admin_fleet').emit('fleet:incident-reported', {
        incidentId: incident._id,
        tripId,
        vehicleId,
        type,
        title,
        description,
        estimatedDelayMinutes,
        reportedAt: incident.createdAt,
      });

      // Broadcast in-app & push notification to all affected parents
      broadcastToTripParents({
        tripId,
        title: type === 'breakdown' ? '🔧 Vehicle Breakdown Reported' : '⚠️ Travel Delay Notification',
        message: `${title}: ${description} (${estimatedDelayMinutes} min expected delay)`,
        type: type === 'breakdown' ? 'breakdown' : 'delay',
        data: {
          tripId: tripId.toString(),
          incidentId: incident._id.toString(),
        },
        io,
      }).catch((e) => console.error(e));

      // Create in-app notifications for Admin users
      try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: `⚠️ Incident Reported: ${title}`,
            message: `${description} (${estimatedDelayMinutes}m delay)`,
            type: type === 'breakdown' ? 'incident_alert' : 'incident_delay',
            data: { tripId: tripId?.toString(), incidentId: incident._id.toString() },
          });
        }
      } catch (notifErr) {
        console.error('[Admin Notification Error]', notifErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Incident reported and parents have been notified.',
      data: incident,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get trip history for the driver
 * @route   GET /api/driver/trips
 * @access  Private (Driver)
 */
exports.getTripHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trips = await Trip.find({ driverId: req.user._id })
      .populate('routeId', 'name routeCode')
      .populate('vehicleId', 'registrationNumber makeModel')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Trip.countDocuments({ driverId: req.user._id });

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: trips,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update current stop index on active trip
 * @route   PUT /api/driver/trips/:id/stop
 * @access  Private (Driver / Assistant)
 */
exports.updateCurrentStop = async (req, res) => {
  try {
    const { stopIndex } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    trip.currentStopIndex = stopIndex;
    await trip.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip._id}`).emit('trip:stop-changed', {
        tripId: trip._id,
        currentStopIndex: stopIndex,
      });
    }

    res.status(200).json({
      success: true,
      message: `Stop updated to index ${stopIndex}`,
      data: trip,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
