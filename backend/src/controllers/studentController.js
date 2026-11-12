const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

/**
 * @desc    Get all students linked to current parent
 * @route   GET /api/students
 * @access  Private (Parent or Admin)
 */
exports.getStudents = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { parentId: req.user._id };
    const students = await Student.find(query)
      .populate('assignedVehicleId')
      .populate('assignedRouteId')
      .sort({ createdAt: -1 });

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
 * @desc    Get single student profile with full transportation details
 * @route   GET /api/students/:id
 * @access  Private
 */
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('assignedVehicleId')
      .populate('assignedRouteId')
      .populate('parentId', 'name phone email emergencyContact address');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Security check: parents can only see their own children
    if (
      req.user.role === 'parent' &&
      student.parentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only view details of your linked children.',
      });
    }

    // Populate driver info if vehicle is assigned
    let driverInfo = null;
    let assistantInfo = null;
    if (student.assignedVehicleId && student.assignedVehicleId.driverId) {
      driverInfo = await User.findById(student.assignedVehicleId.driverId).select(
        'name phone avatarUrl licenseNumber'
      );
    }
    if (student.assignedVehicleId && student.assignedVehicleId.assistantId) {
      assistantInfo = await User.findById(student.assignedVehicleId.assistantId).select(
        'name phone avatarUrl'
      );
    }

    // Recent 10 attendance events
    const recentAttendance = await Attendance.find({ studentId: student._id })
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        student,
        driver: driverInfo,
        assistant: assistantInfo,
        recentAttendance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Register / Add a child
 * @route   POST /api/students
 * @access  Private (Parent / Admin)
 */
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      admissionNumber,
      schoolName,
      grade,
      pickupAddress,
      pickupLat,
      pickupLng,
      pickupTime,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      dropoffTime,
      photoUrl,
      assignedVehicleId,
      assignedRouteId,
      monthlyFee,
    } = req.body;

    const parentId = req.user.role === 'parent' ? req.user._id : req.body.parentId;

    const student = await Student.create({
      name,
      admissionNumber,
      schoolName,
      grade,
      parentId,
      photoUrl: photoUrl || '',
      assignedVehicleId: assignedVehicleId || null,
      assignedRouteId: assignedRouteId || null,
      monthlyFee: monthlyFee || 7500,
      pickupLocation: {
        address: pickupAddress || 'Home Pickup Stop',
        latitude: Number(pickupLat) || 6.8485,
        longitude: Number(pickupLng) || 79.9267,
        scheduledTime: pickupTime || '06:30 AM',
      },
      dropoffLocation: {
        address: dropoffAddress || pickupAddress || 'Home Drop Stop',
        latitude: Number(dropoffLat) || Number(pickupLat) || 6.8485,
        longitude: Number(dropoffLng) || Number(pickupLng) || 79.9267,
        scheduledTime: dropoffTime || '02:30 PM',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Student profile created and linked successfully',
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update student profile
 * @route   PUT /api/students/:id
 * @access  Private (Parent / Admin)
 */
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (
      req.user.role === 'parent' &&
      student.parentId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only update your own children.',
      });
    }

    // Update allowable fields
    const updates = req.body;
    student = await Student.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      data: student,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Parent reports child absent for today
 * @route   POST /api/students/:id/absence
 * @access  Private (Parent)
 */
exports.reportAbsence = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only report absence for your own child.',
      });
    }

    const { reason = 'Sick leave / Family event', date } = req.body;

    // Check if there is an active/scheduled trip today
    const trip = await Trip.findOne({
      vehicleId: student.assignedVehicleId,
      status: { $in: ['scheduled', 'assigned', 'ready', 'started', 'active'] },
    });

    let attendance = null;
    if (trip) {
      // Record attendance as absent
      attendance = await Attendance.findOneAndUpdate(
        { studentId: student._id, tripId: trip._id, status: 'absent' },
        {
          studentId: student._id,
          tripId: trip._id,
          recordedBy: req.user._id,
          status: 'absent',
          method: 'manual',
          notes: `Parent Reported: ${reason}`,
          timestamp: new Date(),
        },
        { upsert: true, new: true }
      );

      // Real-time broadcast to Driver & Assistant
      const io = req.app.get('io');
      if (io) {
        io.to(`trip_${trip._id}`).emit('trip:student-absent', {
          studentId: student._id,
          studentName: student.name,
          reason,
        });
        io.emit('trip:attendance-update', {
          tripId: trip._id,
          studentId: student._id,
          status: 'absent',
          timestamp: attendance.timestamp,
        });
      }

      // In-app notifications to driver and assistant
      const Notification = require('../models/Notification');
      if (trip.driverId) {
        await Notification.create({
          userId: trip.driverId,
          title: '⚠️ Student Absent Notice',
          message: `${student.name} will not use the van today (${reason}).`,
          type: 'attendance_alert',
          data: { studentId: student._id.toString(), tripId: trip._id.toString() },
        });
      }
      if (trip.assistantId) {
        await Notification.create({
          userId: trip.assistantId,
          title: '⚠️ Student Absent Notice',
          message: `${student.name} will not use the van today (${reason}).`,
          type: 'attendance_alert',
          data: { studentId: student._id.toString(), tripId: trip._id.toString() },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Absence notice registered for ${student.name}. The driver and assistant have been notified.`,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
