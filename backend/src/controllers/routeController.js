const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

// Helper to log administrative actions
const createAudit = async (req, action, targetType, targetId, details = {}) => {
  try {
    if (req.user && req.user._id) {
      await AuditLog.create({
        userId: req.user._id,
        action,
        targetType,
        targetId,
        details,
        ipAddress: req.ip || req.connection?.remoteAddress || '',
      });
    }
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
};

/**
 * @desc    Get all routes with search & geographic filters
 * @route   GET /api/routes
 * @access  Private (Admin, Driver, Assistant, Parent)
 */
exports.getAllRoutes = async (req, res) => {
  try {
    const { search, province, district, status, tripType } = req.query;
    const query = {};

    // Role-based status filter: non-admins only see active routes by default
    if (req.user?.role !== 'admin') {
      query.isActive = true;
    } else if (status) {
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
    }

    if (province && province !== 'all') {
      query.province = new RegExp(`^${province}$`, 'i');
    }

    if (district && district !== 'all') {
      query.district = new RegExp(`^${district}$`, 'i');
    }

    if (tripType && tripType !== 'all') {
      query.$or = [{ tripType }, { tripType: 'both' }];
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { routeCode: searchRegex },
        { destinationSchool: searchRegex },
        { town: searchRegex },
        { 'startLocation.name': searchRegex },
        { 'endLocation.name': searchRegex },
      ];
    }

    const routes = await Route.find(query)
      .populate('assignedVehicleId', 'registrationNumber makeModel capacity status')
      .sort({ name: 1 })
      .lean();

    // Attach student count assigned to each route
    const routeIds = routes.map((r) => r._id);
    const studentCounts = await Student.aggregate([
      { $match: { assignedRouteId: { $in: routeIds } } },
      { $group: { _id: '$assignedRouteId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    studentCounts.forEach((sc) => {
      countMap[sc._id.toString()] = sc.count;
    });

    const populatedRoutes = routes.map((r) => ({
      ...r,
      studentCount: countMap[r._id.toString()] || 0,
      stopsCount: (r.stops || []).length,
    }));

    res.status(200).json({
      success: true,
      count: populatedRoutes.length,
      data: populatedRoutes,
    });
  } catch (error) {
    console.error('[Get All Routes Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single route by ID with stops and vehicle
 * @route   GET /api/routes/:id
 * @access  Private
 */
exports.getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate({
        path: 'assignedVehicleId',
        populate: [
          { path: 'driverId', select: 'name phone avatarUrl' },
          { path: 'assistantId', select: 'name phone' },
        ],
      })
      .lean();

    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    const assignedStudents = await Student.find({ assignedRouteId: route._id })
      .select('name admissionNumber grade schoolName pickupLocation dropoffLocation')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...route,
        assignedStudents,
        studentCount: assignedStudents.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new route with ordered stops
 * @route   POST /api/routes
 * @access  Private (Admin)
 */
exports.createRoute = async (req, res) => {
  try {
    const {
      name,
      routeCode,
      province,
      district,
      town,
      destinationSchool,
      description,
      tripType = 'both',
      estimatedDurationMinutes = 45,
      distanceKm = 15,
      startLocation,
      endLocation,
      stops = [],
      assignedVehicleId,
      isActive = true,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Route name is required.' });
    }

    if (!routeCode || !routeCode.trim()) {
      return res.status(400).json({ success: false, message: 'Route code is required.' });
    }

    const formattedCode = routeCode.trim().toUpperCase();

    // Check duplicate route code
    const existing = await Route.findOne({ routeCode: formattedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Route code '${formattedCode}' already exists. Please choose a unique code.`,
      });
    }

    if (!startLocation || startLocation.latitude === undefined || startLocation.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Start location with valid GPS coordinates is required.',
      });
    }

    if (!endLocation || endLocation.latitude === undefined || endLocation.longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'End location with valid GPS coordinates is required.',
      });
    }

    // Sanitize and sequence stops
    const sanitizedStops = (Array.isArray(stops) ? stops : []).map((stop, idx) => ({
      sequence: Number(stop.sequence) || idx + 1,
      name: stop.name || `Stop ${idx + 1}`,
      type: stop.type || 'pickup',
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
      scheduledTime: stop.scheduledTime || '07:00 AM',
      walkingDistanceMeters: Number(stop.walkingDistanceMeters) || 150,
      landmark: stop.landmark || '',
    }));

    // Verify assigned vehicle if provided
    let validVehicleId = null;
    if (assignedVehicleId) {
      const v = await Vehicle.findById(assignedVehicleId);
      if (v) validVehicleId = v._id;
    }

    const route = await Route.create({
      name: name.trim(),
      routeCode: formattedCode,
      province: province || 'Western',
      district: district || 'Colombo',
      town: town || '',
      destinationSchool: destinationSchool || endLocation.name || '',
      description: description || '',
      tripType,
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || 45,
      distanceKm: Number(distanceKm) || 15,
      startLocation: {
        name: startLocation.name || 'Starting Point',
        latitude: Number(startLocation.latitude),
        longitude: Number(startLocation.longitude),
      },
      endLocation: {
        name: endLocation.name || destinationSchool || 'Destination School',
        latitude: Number(endLocation.latitude),
        longitude: Number(endLocation.longitude),
      },
      stops: sanitizedStops,
      assignedVehicleId: validVehicleId,
      isActive: isActive !== false,
    });

    await createAudit(req, 'ROUTE_CREATED', 'Route', route._id, {
      name: route.name,
      routeCode: route.routeCode,
      province: route.province,
      district: route.district,
      stopsCount: sanitizedStops.length,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_fleet').emit('fleet:route-created', route);
    }

    res.status(201).json({
      success: true,
      message: `Route '${route.name}' (${route.routeCode}) created successfully.`,
      data: route,
    });
  } catch (error) {
    console.error('[Create Route Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update existing route & stops
 * @route   PUT /api/routes/:id
 * @access  Private (Admin)
 */
exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    const {
      name,
      routeCode,
      province,
      district,
      town,
      destinationSchool,
      description,
      tripType,
      estimatedDurationMinutes,
      distanceKm,
      startLocation,
      endLocation,
      stops,
      assignedVehicleId,
      isActive,
    } = req.body;

    if (routeCode && routeCode.trim().toUpperCase() !== route.routeCode) {
      const codeCheck = await Route.findOne({
        routeCode: routeCode.trim().toUpperCase(),
        _id: { $ne: route._id },
      });
      if (codeCheck) {
        return res.status(400).json({
          success: false,
          message: `Route code '${routeCode.toUpperCase()}' is already used by another route.`,
        });
      }
      route.routeCode = routeCode.trim().toUpperCase();
    }

    if (name) route.name = name.trim();
    if (province) route.province = province;
    if (district) route.district = district;
    if (town !== undefined) route.town = town;
    if (destinationSchool !== undefined) route.destinationSchool = destinationSchool;
    if (description !== undefined) route.description = description;
    if (tripType) route.tripType = tripType;
    if (estimatedDurationMinutes !== undefined) route.estimatedDurationMinutes = Number(estimatedDurationMinutes);
    if (distanceKm !== undefined) route.distanceKm = Number(distanceKm);
    if (isActive !== undefined) route.isActive = Boolean(isActive);

    if (startLocation) {
      route.startLocation = {
        name: startLocation.name || route.startLocation.name,
        latitude: Number(startLocation.latitude) || route.startLocation.latitude,
        longitude: Number(startLocation.longitude) || route.startLocation.longitude,
      };
    }

    if (endLocation) {
      route.endLocation = {
        name: endLocation.name || route.endLocation.name,
        latitude: Number(endLocation.latitude) || route.endLocation.latitude,
        longitude: Number(endLocation.longitude) || route.endLocation.longitude,
      };
    }

    if (Array.isArray(stops)) {
      route.stops = stops.map((stop, idx) => ({
        sequence: Number(stop.sequence) || idx + 1,
        name: stop.name || `Stop ${idx + 1}`,
        type: stop.type || 'pickup',
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
        scheduledTime: stop.scheduledTime || '07:00 AM',
        walkingDistanceMeters: Number(stop.walkingDistanceMeters) || 150,
        landmark: stop.landmark || '',
      }));
    }

    if (assignedVehicleId !== undefined) {
      route.assignedVehicleId = assignedVehicleId || null;
    }

    await route.save();

    await createAudit(req, 'ROUTE_UPDATED', 'Route', route._id, {
      name: route.name,
      routeCode: route.routeCode,
      stopsCount: route.stops.length,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_fleet').emit('fleet:route-updated', route);
    }

    res.status(200).json({
      success: true,
      message: `Route '${route.name}' updated successfully.`,
      data: route,
    });
  } catch (error) {
    console.error('[Update Route Error]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle Route active status
 * @route   PATCH /api/routes/:id/status
 * @access  Private (Admin)
 */
exports.toggleRouteStatus = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    route.isActive = !route.isActive;
    await route.save();

    await createAudit(req, 'ROUTE_STATUS_TOGGLED', 'Route', route._id, {
      isActive: route.isActive,
    });

    res.status(200).json({
      success: true,
      message: `Route '${route.name}' is now ${route.isActive ? 'active' : 'inactive'}.`,
      data: { id: route._id, isActive: route.isActive },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete route if no active/scheduled trips exist
 * @route   DELETE /api/routes/:id
 * @access  Private (Admin)
 */
exports.deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    // Check if active or scheduled trips exist for this route
    const activeTripsCount = await Trip.countDocuments({
      routeId: route._id,
      status: { $in: ['scheduled', 'assigned', 'ready', 'started', 'active'] },
    });

    if (activeTripsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route '${route.name}'. It is currently assigned to ${activeTripsCount} scheduled or active trip(s). You can deactivate the route instead.`,
      });
    }

    // Unassign route reference from students
    await Student.updateMany({ assignedRouteId: route._id }, { assignedRouteId: null });

    await Route.findByIdAndDelete(route._id);

    await createAudit(req, 'ROUTE_DELETED', 'Route', route._id, {
      name: route.name,
      routeCode: route.routeCode,
    });

    res.status(200).json({
      success: true,
      message: `Route '${route.name}' (${route.routeCode}) deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
