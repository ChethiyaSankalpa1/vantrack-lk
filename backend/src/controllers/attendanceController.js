const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');

/**
 * @desc    Record student boarding or drop-off event
 * @route   POST /api/attendance
 * @access  Private (Driver / Assistant)
 */
exports.recordAttendance = async (req, res) => {
  try {
    const { studentId, tripId, status, method = 'manual', latitude, longitude, address, notes } = req.body;

    if (!studentId || !tripId || !status) {
      return res.status(400).json({
        success: false,
        message: 'studentId, tripId, and status are required',
      });
    }

    // Validate status
    const validStatuses = ['boarded', 'dropped_off', 'absent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Verify trip is active
    const trip = await Trip.findById(tripId);
    if (!trip || trip.status !== 'started') {
      return res.status(400).json({
        success: false,
        message: 'No active trip in progress. Cannot record attendance.',
      });
    }

    // Verify student exists
    const student = await Student.findById(studentId).populate('parentId', '_id name');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Upsert attendance record (prevent duplicate events of the same type per trip)
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, tripId, status },
      {
        studentId,
        tripId,
        recordedBy: req.user._id,
        status,
        timestamp: new Date(),
        method,
        location: {
          latitude: latitude || null,
          longitude: longitude || null,
          address: address || '',
        },
        notes: notes || '',
      },
      { upsert: true, new: true }
    );

    // Create in-app notification for parent
    const statusMessages = {
      boarded: `✅ ${student.name} has safely boarded the school van`,
      dropped_off: `🏠 ${student.name} has safely arrived home after school`,
      absent: `📋 ${student.name} has been recorded as absent today`,
    };

    const statusTitles = {
      boarded: 'Student Boarded',
      dropped_off: 'Student Arrived Home',
      absent: 'Student Marked Absent',
    };

    if (student.parentId) {
      await Notification.create({
        userId: student.parentId._id,
        title: statusTitles[status] || 'Student Status Update',
        message: `${statusMessages[status]}. Time: ${new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}`,
        type: status === 'boarded' ? 'student_boarded' : status === 'dropped_off' ? 'student_dropped' : 'general',
        data: {
          studentId: studentId.toString(),
          tripId: tripId.toString(),
        },
      });
    }

    // Real-time notification to parent & driver on this trip
    const io = req.app.get('io');
    if (io) {
      if (student.parentId) {
        io.emit(`parent:${student.parentId._id}:attendance`, {
          studentId,
          studentName: student.name,
          status,
          timestamp: attendance.timestamp,
          address: address || '',
        });
      }
      // Broadcast to trip room so Driver & Assistant screens update live
      io.to(`trip_${tripId}`).emit('trip:attendance-update', {
        tripId,
        studentId,
        status,
        timestamp: attendance.timestamp,
      });
      io.emit('trip:attendance-update', {
        tripId,
        studentId,
        status,
        timestamp: attendance.timestamp,
      });
    }

    res.status(200).json({
      success: true,
      message: `Attendance recorded: ${student.name} — ${status}`,
      data: attendance,
    });
  } catch (error) {
    // Handle duplicate key error gracefully (concurrent recording attempt)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this student and event on this trip',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Scan QR code and auto-record attendance
 * @route   POST /api/attendance/qr-scan
 * @access  Private (Driver / Assistant)
 */
exports.qrScanAttendance = async (req, res) => {
  try {
    const { qrCodeString, tripId, status = 'boarded', latitude, longitude } = req.body;

    if (!qrCodeString || !tripId) {
      return res.status(400).json({
        success: false,
        message: 'qrCodeString and tripId are required',
      });
    }

    // Find student by QR code
    const student = await Student.findOne({ qrCodeString });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'No student found for this QR code. Please check the Van Pass.',
      });
    }

    // Reuse record attendance logic
    req.body.studentId = student._id.toString();
    req.body.method = 'qr_scan';
    return exports.recordAttendance(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get attendance records for a specific trip
 * @route   GET /api/attendance/trip/:tripId
 * @access  Private (Driver / Assistant / Parent)
 */
exports.getTripAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ tripId: req.params.tripId })
      .populate('studentId', 'name photoUrl grade schoolName qrCodeString')
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get attendance history for a student
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ studentId: req.params.studentId })
      .populate('tripId', 'tripType date status')
      .populate('recordedBy', 'name role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
