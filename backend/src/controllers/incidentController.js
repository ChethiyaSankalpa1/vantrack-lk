const Incident = require('../models/Incident');
const Student = require('../models/Student');
const Trip = require('../models/Trip');

/**
 * @desc    Get incidents relevant to logged-in user
 * @route   GET /api/incidents
 * @access  Private
 */
exports.getIncidents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.user.role === 'parent') {
      // Find parent's children's vehicles
      const students = await Student.find({ parentId: req.user._id }).select('assignedVehicleId').lean();
      const vehicleIds = students.map((s) => s.assignedVehicleId).filter(Boolean);
      filter = { vehicleId: { $in: vehicleIds } };
    } else if (req.user.role === 'driver') {
      filter = { reportedBy: req.user._id };
    }

    if (req.query.tripId) {
      filter.tripId = req.query.tripId;
    }

    const incidents = await Incident.find(filter)
      .populate('reportedBy', 'name phone role avatarUrl')
      .populate('vehicleId', 'registrationNumber makeModel')
      .populate('tripId', 'tripType date status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Incident.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: incidents.length,
      total,
      data: incidents,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single incident details
 * @route   GET /api/incidents/:id
 * @access  Private
 */
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name phone role avatarUrl')
      .populate('vehicleId', 'registrationNumber makeModel')
      .populate('tripId');

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident record not found' });
    }

    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
