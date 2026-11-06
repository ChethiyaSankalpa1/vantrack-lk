const Student = require('../models/Student');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Route = require('../models/Route');

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
