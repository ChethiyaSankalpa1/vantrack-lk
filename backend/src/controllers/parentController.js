const Student = require('../models/Student');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Route = require('../models/Route');
const VehicleLocation = require('../models/VehicleLocation');

/**
 * @desc    Get aggregated parent dashboard data
 * @route   GET /api/parent/dashboard
 * @access  Private (Parent only)
 */
exports.getParentDashboard = async (req, res) => {
  try {
    const parentId = req.user._id;

    // 1. Fetch all children belonging to this parent
    const students = await Student.find({ parentId })
      .populate('assignedVehicleId')
      .populate('assignedRouteId')
      .lean();

    if (!students || students.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          students: [],
          activeTrip: null,
          todayAttendance: [],
          latestInvoice: null,
          message: 'No students currently linked. Please register your child to begin transportation tracking.',
        },
      });
    }

    // 2. Populate driver details for assigned vehicles
    for (let student of students) {
      if (student.assignedVehicleId && student.assignedVehicleId.driverId) {
        student.assignedVehicleId.driver = await require('../models/User')
          .findById(student.assignedVehicleId.driverId)
          .select('name phone avatarUrl licenseNumber')
          .lean();
      }
      if (student.assignedVehicleId && student.assignedVehicleId.assistantId) {
        student.assignedVehicleId.assistant = await require('../models/User')
          .findById(student.assignedVehicleId.assistantId)
          .select('name phone avatarUrl')
          .lean();
      }
    }

    // 3. Find any active trip for the children's vehicles today
    const vehicleIds = students
      .map((s) => s.assignedVehicleId?._id)
      .filter(Boolean);

    let activeTrip = null;
    if (vehicleIds.length > 0) {
      activeTrip = await Trip.findOne({
        vehicleId: { $in: vehicleIds },
        status: { $in: ['started', 'scheduled'] },
      })
        .populate('routeId')
        .populate('vehicleId')
        .populate('driverId', 'name phone avatarUrl')
        .sort({ updatedAt: -1 })
        .lean();
    }

    // 4. Fetch today's attendance for the parent's children
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const studentIds = students.map((s) => s._id);
    const todayAttendance = await Attendance.find({
      studentId: { $in: studentIds },
      timestamp: { $gte: startOfToday },
    })
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 })
      .lean();

    // 5. Fetch latest unpaid or pending invoice for fee reminder
    const latestInvoice = await Invoice.findOne({
      parentId,
      status: { $in: ['unpaid', 'pending_verification'] },
    })
      .sort({ dueDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        parent: {
          id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          email: req.user.email,
          emergencyContact: req.user.emergencyContact,
          address: req.user.address,
        },
        students,
        activeTrip,
        todayAttendance,
        latestInvoice,
      },
    });
  } catch (error) {
    console.error('[Parent Dashboard Error]', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error loading parent dashboard',
    });
  }
};

/**
 * @desc    Get live trip data for parent (vehicle location, trip, stops)
 * @route   GET /api/parent/live-trip
 * @access  Private (Parent)
 */
exports.getLiveTrip = async (req, res) => {
  try {
    const parentId = req.user._id;

    // Find parent's children
    const students = await Student.find({ parentId }).lean();
    if (!students.length) {
      return res.status(200).json({ success: true, data: null });
    }

    // Get their vehicle IDs
    const vehicleIds = students.map((s) => s.assignedVehicleId).filter(Boolean);
    if (!vehicleIds.length) {
      return res.status(200).json({ success: true, data: null });
    }

    // Find active trip for any of their vehicles
    const trip = await Trip.findOne({
      vehicleId: { $in: vehicleIds },
      status: 'started',
    })
      .populate('routeId')
      .populate('vehicleId')
      .populate('driverId', 'name phone avatarUrl')
      .lean();

    if (!trip) {
      return res.status(200).json({ success: true, data: null });
    }

    // Get latest GPS location
    const location = await VehicleLocation.findOne({ tripId: trip._id })
      .sort({ recordedAt: -1 })
      .lean();

    // Get today's attendance for this parent's children
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const studentIds = students.map((s) => s._id);
    const attendance = await Attendance.find({
      tripId: trip._id,
      studentId: { $in: studentIds },
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        trip,
        location,
        attendance,
        students,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get trip history for parent's children
 * @route   GET /api/parent/trip-history
 * @access  Private (Parent)
 */
exports.getTripHistory = async (req, res) => {
  try {
    const parentId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const students = await Student.find({ parentId }).lean();
    const vehicleIds = students.map((s) => s.assignedVehicleId).filter(Boolean);

    if (!vehicleIds.length) {
      return res.status(200).json({ success: true, data: [], total: 0 });
    }

    const trips = await Trip.find({
      vehicleId: { $in: vehicleIds },
      status: { $in: ['completed', 'started'] },
    })
      .populate('routeId', 'name routeCode stops')
      .populate('vehicleId', 'registrationNumber makeModel')
      .populate('driverId', 'name phone avatarUrl')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Trip.countDocuments({
      vehicleId: { $in: vehicleIds },
      status: { $in: ['completed', 'started'] },
    });

    // Attach attendance for each trip
    const tripIds = trips.map((t) => t._id);
    const studentIds = students.map((s) => s._id);
    const allAttendance = await Attendance.find({
      tripId: { $in: tripIds },
      studentId: { $in: studentIds },
    }).lean();

    const tripsWithAttendance = trips.map((t) => ({
      ...t,
      attendance: allAttendance.filter(
        (a) => a.tripId.toString() === t._id.toString()
      ),
    }));

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tripsWithAttendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
