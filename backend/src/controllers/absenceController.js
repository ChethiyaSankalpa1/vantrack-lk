const AbsenceReport = require('../models/AbsenceReport');
const Student = require('../models/Student');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendNotification } = require('../services/notificationService');

const logAudit = async (req, action, targetId, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      action,
      targetType: 'AbsenceReport',
      targetId,
      details,
      ipAddress: req.ip || '',
    });
  } catch (_) {}
};

/**
 * @desc    Parent submits Student Absence Report
 * @route   POST /api/students/:studentId/absence-report
 * @access  Private (Parent)
 */
exports.submitAbsenceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      absenceDate,
      absenceType = 'full_day',
      reason = 'sick',
      additionalNote = '',
    } = req.body;

    if (!absenceDate) {
      return res.status(400).json({ success: false, message: 'Absence date is required.' });
    }

    const student = await Student.findById(studentId).populate('assignedVehicleId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Verify parent ownership
    if (req.user.role === 'parent' && student.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only report absences for your own registered child.',
      });
    }

    const parsedDate = new Date(absenceDate);
    const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));

    // Check for duplicate active report on same date
    const existing = await AbsenceReport.findOne({
      studentId: student._id,
      absenceDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['submitted', 'ACKNOWLEDGED'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `An active absence report already exists for ${student.name} on ${startOfDay.toISOString().split('T')[0]}.`,
      });
    }

    // Find affected trips for assigned vehicle on this date
    let affectedTripIds = [];
    if (student.assignedVehicleId) {
      const trips = await Trip.find({
        vehicleId: student.assignedVehicleId._id || student.assignedVehicleId,
        date: startOfDay.toISOString().split('T')[0],
      }).select('_id');
      affectedTripIds = trips.map((t) => t._id);
    }

    const report = await AbsenceReport.create({
      studentId: student._id,
      parentId: req.user._id,
      absenceDate: startOfDay,
      absenceType,
      reason,
      additionalNote: additionalNote ? additionalNote.trim() : '',
      affectedTripIds,
      status: 'submitted',
      submittedAt: new Date(),
    });

    const io = req.app.get('io');
    const typeLabel =
      absenceType === 'full_day'
        ? 'Full Day Absence'
        : absenceType === 'morning_only'
        ? 'Morning Pickup Only'
        : absenceType === 'afternoon_only'
        ? 'Afternoon Return Only'
        : 'Both Transport Not Required';

    const formattedDate = startOfDay.toLocaleDateString('en-LK');

    // 1. Notify Parent Confirmation
    await sendNotification({
      userId: req.user._id,
      title: '📋 Absence Report Submitted',
      message: `Absence report submitted for ${student.name} on ${formattedDate} (${typeLabel}). Operator, driver & assistant notified.`,
      type: 'general',
      data: { studentId: student._id.toString(), absenceId: report._id.toString() },
      io,
    });

    // 2. Notify Assigned Driver & Assistant
    if (student.assignedVehicleId) {
      const vehicle = await Vehicle.findById(student.assignedVehicleId._id || student.assignedVehicleId);
      if (vehicle) {
        if (vehicle.driverId) {
          await sendNotification({
            userId: vehicle.driverId,
            title: '📋 Student Absence Alert',
            message: `${student.name} is reported absent on ${formattedDate} (${typeLabel}). Roster updated.`,
            type: 'general',
            data: { studentId: student._id.toString(), absenceId: report._id.toString() },
            io,
          });
        }
        if (vehicle.assistantId) {
          await sendNotification({
            userId: vehicle.assistantId,
            title: '📋 Student Absence Alert',
            message: `${student.name} is reported absent on ${formattedDate} (${typeLabel}). Roster updated.`,
            type: 'general',
            data: { studentId: student._id.toString(), absenceId: report._id.toString() },
            io,
          });
        }
      }
    }

    await logAudit(req, 'STUDENT_ABSENCE_SUBMITTED', report._id, {
      studentName: student.name,
      absenceDate: formattedDate,
      absenceType,
    });

    res.status(201).json({
      success: true,
      message: `Absence report submitted successfully for ${student.name}.`,
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Student Absence History
 * @route   GET /api/students/:studentId/absences
 * @access  Private (Parent / Admin)
 */
exports.getStudentAbsences = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    if (req.user.role === 'parent' && student.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this student\'s absences.' });
    }

    const reports = await AbsenceReport.find({ studentId })
      .populate('studentId', 'name schoolName grade')
      .populate('parentId', 'name phone')
      .populate('reviewedBy', 'name role')
      .sort({ absenceDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Parent cancels pending absence report
 * @route   PATCH /api/students/absences/:absenceId/cancel
 * @access  Private (Parent)
 */
exports.cancelAbsenceReport = async (req, res) => {
  try {
    const report = await AbsenceReport.findById(req.params.absenceId).populate('studentId');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Absence report not found.' });
    }

    if (req.user.role === 'parent' && report.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this report.' });
    }

    if (report.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Report is already cancelled.' });
    }

    report.status = 'cancelled';
    await report.save();

    const io = req.app.get('io');
    await sendNotification({
      userId: req.user._id,
      title: '📋 Absence Report Cancelled',
      message: `Absence report for ${report.studentId?.name || 'child'} on ${new Date(report.absenceDate).toLocaleDateString()} was cancelled. Student restored to van roster.`,
      type: 'general',
      data: { studentId: report.studentId._id.toString(), absenceId: report._id.toString() },
      io,
    });

    res.status(200).json({
      success: true,
      message: 'Absence report cancelled successfully. Student restored to van route roster.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin Query Absence Reports
 * @route   GET /api/admin/absences
 * @access  Private (Admin)
 */
exports.getAdminAbsenceReports = async (req, res) => {
  try {
    const { status, date, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (date) {
      const parsedDate = new Date(date);
      filter.absenceDate = {
        $gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(parsedDate.setHours(23, 59, 59, 999)),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const reports = await AbsenceReport.find(filter)
      .populate({
        path: 'studentId',
        select: 'name admissionNumber schoolName grade pickupAddress assignedVehicleId',
        populate: { path: 'assignedVehicleId', select: 'registrationNumber driverId assistantId' },
      })
      .populate('parentId', 'name phone email')
      .populate('reviewedBy', 'name role')
      .sort({ absenceDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await AbsenceReport.countDocuments(filter);
    const submittedCount = await AbsenceReport.countDocuments({ status: 'submitted' });
    const acknowledgedCount = await AbsenceReport.countDocuments({ status: 'ACKNOWLEDGED' });

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      stats: {
        submittedCount,
        acknowledgedCount,
      },
      data: reports,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin Acknowledge Absence Report
 * @route   PATCH /api/admin/absences/:absenceId/acknowledge
 * @access  Private (Admin)
 */
exports.acknowledgeAbsenceReport = async (req, res) => {
  try {
    const report = await AbsenceReport.findById(req.params.absenceId)
      .populate('studentId', 'name')
      .populate('parentId', 'name phone email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Absence report not found.' });
    }

    report.status = 'ACKNOWLEDGED';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    const io = req.app.get('io');
    await sendNotification({
      userId: report.parentId._id,
      title: '✅ Absence Report Acknowledged',
      message: `School van operator acknowledged the absence report for ${report.studentId?.name || 'child'} on ${new Date(report.absenceDate).toLocaleDateString()}.`,
      type: 'general',
      data: { studentId: report.studentId._id.toString(), absenceId: report._id.toString() },
      io,
    });

    await logAudit(req, 'ABSENCE_REPORT_ACKNOWLEDGED', report._id, {
      studentName: report.studentId?.name,
    });

    res.status(200).json({
      success: true,
      message: 'Absence report acknowledged. Parent notified.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Admin Reject Absence Report
 * @route   PATCH /api/admin/absences/:absenceId/reject
 * @access  Private (Admin)
 */
exports.rejectAbsenceReport = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory rejection reason must be provided.',
      });
    }

    const report = await AbsenceReport.findById(req.params.absenceId)
      .populate('studentId', 'name')
      .populate('parentId', 'name phone email');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Absence report not found.' });
    }

    report.status = 'REJECTED';
    report.rejectionReason = rejectionReason.trim();
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    const io = req.app.get('io');
    await sendNotification({
      userId: report.parentId._id,
      title: '❌ Absence Report Declined',
      message: `Absence report for ${report.studentId?.name || 'child'} on ${new Date(report.absenceDate).toLocaleDateString()} was declined. Reason: ${rejectionReason.trim()}`,
      type: 'general',
      data: { studentId: report.studentId._id.toString(), absenceId: report._id.toString() },
      io,
    });

    await logAudit(req, 'ABSENCE_REPORT_REJECTED', report._id, {
      reason: rejectionReason.trim(),
    });

    res.status(200).json({
      success: true,
      message: 'Absence report rejected. Parent notified.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
