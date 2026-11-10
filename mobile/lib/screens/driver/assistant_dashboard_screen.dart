import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';
import 'widgets/driver_student_list.dart';

class AssistantDashboardScreen extends StatefulWidget {
  const AssistantDashboardScreen({super.key});

  @override
  State<AssistantDashboardScreen> createState() => _AssistantDashboardScreenState();
}

class _AssistantDashboardScreenState extends State<AssistantDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DriverProvider>().loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final driver = context.watch<DriverProvider>();
    final auth = context.watch<AuthProvider>();
    final data = driver.dashboardData;
    final user = auth.user;
    final vehicle = data?.vehicle;
    final activeTrip = driver.activeTrip;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'VanTrack',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppColors.info,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'ASSISTANT',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              'Attendant: ${user?.name.split(' ').first ?? 'Assistant'}',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            onPressed: () => driver.loadDashboard(),
          ),
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded, color: Colors.white70),
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, AppRoutes.login);
              }
            },
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: driver.isLoading && data == null
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Vehicle Header
                if (vehicle != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    color: AppColors.primary,
                    child: Row(
                      children: [
                        const Icon(Icons.directions_bus_rounded, color: Colors.white70, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          vehicle['registrationNumber'] ?? 'WP NB-XXXX',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          vehicle['makeModel'] ?? 'Toyota HiAce',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (activeTrip != null ? AppColors.accent : AppColors.cardBorder)
                                .withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: activeTrip != null ? AppColors.accent : Colors.white38,
                            ),
                          ),
                          child: Text(
                            activeTrip != null ? 'TRIP ACTIVE' : 'NO ACTIVE TRIP',
                            style: TextStyle(
                              color: activeTrip != null ? AppColors.accent : Colors.white70,
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Assistant Instructions Banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  color: AppColors.info.withValues(alpha: 0.1),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_outlined, color: AppColors.info, size: 20),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Student Safety Officer: Record student boarding and drop-off accurately at each stop.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Student List for Boarding / Drop-off
                Expanded(
                  child: DriverStudentList(
                    students: driver.assignedStudents,
                    activeTrip: activeTrip,
                    isBoarded: driver.isBoarded,
                    isDropped: driver.isDropped,
                    onMarkBoarded: (studentId) =>
                        _markAttendance(driver, studentId, 'boarded'),
                    onMarkDropped: (studentId) =>
                        _markAttendance(driver, studentId, 'dropped_off'),
                    onMarkAbsent: (studentId) =>
                        _markAttendance(driver, studentId, 'absent'),
                    onRefresh: () => driver.loadDashboard(),
                  ),
                ),
              ],
            ),
      floatingActionButton: activeTrip != null
          ? FloatingActionButton.extended(
              backgroundColor: AppColors.info,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.qr_code_scanner_rounded),
              label: const Text('Scan QR Pass', style: TextStyle(fontWeight: FontWeight.w700)),
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  AppRoutes.qrScanner,
                  arguments: {
                    'tripId': activeTrip.id,
                    'initialMode': 'boarded',
                  },
                );
              },
            )
          : null,
    );
  }

  Future<void> _markAttendance(DriverProvider driver, String studentId, String status) async {
    if (driver.activeTrip == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Trip is not yet started by the driver.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    bool success;
    if (status == 'boarded') {
      success = await driver.markBoarded(studentId);
    } else if (status == 'dropped_off') {
      success = await driver.markDropped(studentId);
    } else {
      success = await driver.markAbsent(studentId);
    }

    if (mounted) {
      final labels = {
        'boarded': '✅ Boarded',
        'dropped_off': '🏠 Dropped Off',
        'absent': '📋 Absent',
      };
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? '${labels[status]} — Parent notified'
                : 'Failed to record attendance',
          ),
          backgroundColor: success ? AppColors.success : AppColors.error,
        ),
      );
    }
  }
}
