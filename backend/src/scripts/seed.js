const path = require('path');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Trip = require('../models/Trip');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vantrack_lk';
    console.log(`[Seed] Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);
    console.log('[Seed] Database connected. Clearing old test data...');

    // Clear old collections
    await Promise.all([
      User.deleteMany(),
      Vehicle.deleteMany(),
      Route.deleteMany(),
      Student.deleteMany(),
      Trip.deleteMany(),
      Attendance.deleteMany(),
      Invoice.deleteMany(),
      Notification.deleteMany(),
    ]);

    console.log('[Seed] Old data wiped. Creating user accounts...');

    // 1. Create Users
    const admin = await User.create({
      name: 'VanTrack Fleet Admin',
      email: 'admin@vantrack.lk',
      phone: '0112345678',
      password: 'password123',
      role: 'admin',
      address: 'VanTrack LK Operations, Colombo 03',
    });

    const driver = await User.create({
      name: 'Sunil Shantha',
      email: 'driver@vantrack.lk',
      phone: '0783456789',
      password: 'password123',
      role: 'driver',
      licenseNumber: 'B-9876543',
      nicNumber: '197824501234',
      address: '24 Temple Road, Maharagama',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
    });

    const assistant = await User.create({
      name: 'Kamal Bandara',
      email: 'assistant@vantrack.lk',
      phone: '0754567890',
      password: 'password123',
      role: 'assistant',
      nicNumber: '199214508765',
      address: '15 Station Road, Pannipitiya',
    });

    const parent1 = await User.create({
      name: 'Kasun Jayawardena',
      email: 'parent@vantrack.lk',
      phone: '0771234567',
      password: 'password123',
      role: 'parent',
      emergencyContact: '0719876543',
      address: '18/4, High Level Road, Nugegoda',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    });

    const parent2 = await User.create({
      name: 'Nimali Perera',
      email: 'nimali@vantrack.lk',
      phone: '0712345678',
      password: 'password123',
      role: 'parent',
      emergencyContact: '0777654321',
      address: '45/B, School Lane, Maharagama',
    });

    console.log('[Seed] Users created. Creating vehicles...');

    // 2. Create Vehicle
    const vehicle = await Vehicle.create({
      registrationNumber: 'WP NB-7842',
      makeModel: 'Toyota HiAce KDH 200 Super GL',
      capacity: 16,
      color: 'School Yellow & White',
      driverId: driver._id,
      assistantId: assistant._id,
      status: 'active',
      photoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400',
    });

    // Link vehicle to driver
    driver.assignedVehicleId = vehicle._id;
    await driver.save();

    console.log('[Seed] Vehicle created. Creating route...');

    // 3. Create Route (Maharagama to Colombo 07 Schools)
    const route = await Route.create({
      name: 'Maharagama - Colombo 07 School Express',
      routeCode: 'VT-COL-01',
      tripType: 'both',
      startLocation: {
        name: 'Maharagama Clock Tower',
        latitude: 6.8485,
        longitude: 79.9267,
      },
      endLocation: {
        name: 'Royal College, Colombo 07',
        latitude: 6.9064,
        longitude: 79.8606,
      },
      assignedVehicleId: vehicle._id,
      stops: [
        {
          sequence: 1,
          name: 'Maharagama Clock Tower Bus Stop',
          type: 'pickup',
          latitude: 6.8485,
          longitude: 79.9267,
          scheduledTime: '06:15 AM',
          walkingDistanceMeters: 80,
          landmark: 'Opposite People\'s Bank',
        },
        {
          sequence: 2,
          name: 'Pannipitiya Flyover Junction',
          type: 'pickup',
          latitude: 6.8450,
          longitude: 79.9540,
          scheduledTime: '06:25 AM',
          walkingDistanceMeters: 120,
          landmark: 'Near Railway Crossing',
        },
        {
          sequence: 3,
          name: 'Nugegoda Supermarket / Flyover Stop',
          type: 'pickup',
          latitude: 6.8725,
          longitude: 79.8988,
          scheduledTime: '06:40 AM',
          walkingDistanceMeters: 60,
          landmark: 'Nugegoda Ananda Sastralaya Gate',
        },
        {
          sequence: 4,
          name: 'Havelock Town Junction',
          type: 'pickup',
          latitude: 6.8872,
          longitude: 79.8680,
          scheduledTime: '06:55 AM',
          walkingDistanceMeters: 100,
          landmark: 'Opposite Police Post',
        },
        {
          sequence: 5,
          name: 'Visakha Vidyalaya, Colombo 05',
          type: 'school_drop',
          latitude: 6.8920,
          longitude: 79.8590,
          scheduledTime: '07:10 AM',
          walkingDistanceMeters: 20,
          landmark: 'Primary Section Main Gate',
        },
        {
          sequence: 6,
          name: 'Royal College, Colombo 07',
          type: 'school_drop',
          latitude: 6.9064,
          longitude: 79.8606,
          scheduledTime: '07:25 AM',
          walkingDistanceMeters: 30,
          landmark: 'Reid Avenue Junior Gate',
        },
      ],
    });

    console.log('[Seed] Route created. Creating students...');

    // 4. Create Students
    const student1 = await Student.create({
      name: 'Shehan Jayawardena',
      admissionNumber: 'RC-2021-8492',
      schoolName: 'Royal College, Colombo 07',
      grade: 'Grade 8-B',
      parentId: parent1._id,
      assignedVehicleId: vehicle._id,
      assignedRouteId: route._id,
      monthlyFee: 7500,
      pickupLocation: {
        address: 'Nugegoda Supermarket / Flyover Stop',
        latitude: 6.8725,
        longitude: 79.8988,
        scheduledTime: '06:40 AM',
      },
      dropoffLocation: {
        address: 'Nugegoda Supermarket / Flyover Stop',
        latitude: 6.8725,
        longitude: 79.8988,
        scheduledTime: '02:30 PM',
      },
      photoUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=200',
    });

    const student2 = await Student.create({
      name: 'Dinuki Perera',
      admissionNumber: 'VV-2023-4120',
      schoolName: 'Visakha Vidyalaya, Colombo 05',
      grade: 'Grade 5-A',
      parentId: parent2._id,
      assignedVehicleId: vehicle._id,
      assignedRouteId: route._id,
      monthlyFee: 7500,
      pickupLocation: {
        address: 'Maharagama Clock Tower Bus Stop',
        latitude: 6.8485,
        longitude: 79.9267,
        scheduledTime: '06:15 AM',
      },
      dropoffLocation: {
        address: 'Maharagama Clock Tower Bus Stop',
        latitude: 6.8485,
        longitude: 79.9267,
        scheduledTime: '02:45 PM',
      },
      photoUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=200',
    });

    console.log('[Seed] Students created. Creating active trip...');

    // 5. Create Active Trip
    const activeTrip = await Trip.create({
      routeId: route._id,
      vehicleId: vehicle._id,
      driverId: driver._id,
      assistantId: assistant._id,
      tripType: 'morning_pickup',
      date: new Date(),
      status: 'started',
      startedAt: new Date(Date.now() - 35 * 60 * 1000), // started 35 mins ago
      currentStopIndex: 2,
      isGpsActive: true,
      delayMinutes: 0,
    });

    vehicle.currentTripId = activeTrip._id;
    vehicle.status = 'in_trip';
    await vehicle.save();

    // 6. Create Student Attendance Records
    await Attendance.create({
      studentId: student2._id,
      tripId: activeTrip._id,
      recordedBy: driver._id,
      status: 'boarded',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      method: 'qr_scan',
      location: {
        latitude: 6.8485,
        longitude: 79.9267,
        address: 'Maharagama Clock Tower Stop',
      },
      notes: 'Safely boarded with school bag',
    });

    // 7. Create Monthly Invoices
    await Invoice.create({
      invoiceNumber: 'INV-2026-11-001',
      parentId: parent1._id,
      studentId: student1._id,
      monthYear: '2026-11',
      amount: 7500,
      dueDate: new Date(2026, 10, 15),
      status: 'unpaid',
      notes: 'November 2026 School Van Fee for Shehan (Nugegoda - Royal College)',
    });

    await Invoice.create({
      invoiceNumber: 'INV-2026-10-001',
      parentId: parent1._id,
      studentId: student1._id,
      monthYear: '2026-10',
      amount: 7500,
      dueDate: new Date(2026, 9, 15),
      status: 'paid',
      paymentMethod: 'payhere_online',
      paidAt: new Date(2026, 9, 12),
      notes: 'October 2026 School Van Fee - Verified',
    });

    await Invoice.create({
      invoiceNumber: 'INV-2026-11-002',
      parentId: parent2._id,
      studentId: student2._id,
      monthYear: '2026-11',
      amount: 7500,
      dueDate: new Date(2026, 10, 15),
      status: 'paid',
      paymentMethod: 'bank_transfer',
      paidAt: new Date(),
      notes: 'November 2026 School Van Fee for Dinuki (Maharagama - Visakha)',
    });

    // 8. Create Sample Notifications
    await Notification.create({
      userId: parent2._id,
      title: 'Dinuki Boarded Van',
      message: 'Dinuki safely boarded van WP NB-7842 at Maharagama Stop (QR verified).',
      type: 'student_boarded',
      data: {
        studentId: student2._id.toString(),
        tripId: activeTrip._id.toString(),
      },
    });

    await Notification.create({
      userId: parent1._id,
      title: 'Morning Van Approaching Nugegoda',
      message: 'Van WP NB-7842 is 5 minutes away from Nugegoda Supermarket Stop.',
      type: 'approaching_stop',
      data: {
        studentId: student1._id.toString(),
        tripId: activeTrip._id.toString(),
      },
    });

    console.log('========================================================');
    console.log('🎉 [Seed] VanTrack LK Database Seed Completed Successfully!');
    console.log('========================================================');
    console.log('Default Seed Accounts:');
    console.log('1. PARENT:    parent@vantrack.lk    / password123 (Kasun - Royal College parent)');
    console.log('2. PARENT:    nimali@vantrack.lk    / password123 (Nimali - Visakha parent)');
    console.log('3. DRIVER:    driver@vantrack.lk    / password123 (Sunil Shantha - WP NB-7842)');
    console.log('4. ASSISTANT: assistant@vantrack.lk / password123 (Kamal Bandara)');
    console.log('5. ADMIN:     admin@vantrack.lk     / password123');
    console.log('========================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
