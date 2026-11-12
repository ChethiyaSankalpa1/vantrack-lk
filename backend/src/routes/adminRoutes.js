const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

// All routes here require valid JWT and role: 'admin'
router.use(protect, authorize('admin'));

// 1. Dashboard Overview & Analytics
router.get('/overview', adminController.getOverview);
router.get('/analytics', adminController.getAnalytics);

// 2. Trip Management
router.get('/trips', adminController.getTrips);
router.post('/trips', adminController.createTrip);
router.get('/trips/:id', adminController.getTripById);
router.put('/trips/:id', adminController.updateTrip);
router.post('/trips/:id/cancel', adminController.cancelTrip);
router.post('/trips/:id/start-override', adminController.startTripOverride);
router.post('/trips/:id/terminate-override', adminController.terminateTripOverride);
router.post('/trips/:id/reassign-vehicle', adminController.reassignVehicle);

// 3. Live Fleet Telemetry
router.get('/fleet/live', adminController.getLiveFleet);

// 4. Students & Parents Management
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.get('/parents', adminController.getParents);
router.post('/parents', adminController.createParent);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// 5. Drivers, Assistants & Fleet Vehicles
router.get('/drivers', adminController.getDrivers);
router.post('/drivers', adminController.createDriver);
router.put('/drivers/:id/assign-vehicle', adminController.assignCrewVehicle);
router.get('/vehicles', adminController.getVehicles);
router.post('/vehicles', adminController.createVehicle);
router.put('/vehicles/:id', adminController.updateVehicle);

// 6. Attendance Logs
router.get('/attendance', adminController.getAttendanceLogs);

// 7. Invoices & Billing
router.get('/invoices', adminController.getInvoices);
router.post('/invoices/bulk-generate', adminController.generateMonthlyInvoices);
router.post('/invoices/:id/verify', adminController.verifyInvoicePayment);

// 8. Incidents
router.get('/incidents', adminController.getIncidents);
router.put('/incidents/:id/resolve', adminController.resolveIncident);

// 9. Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
