import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';
import '../../services/driver_service.dart';
import 'widgets/driver_incident_button.dart';
import 'widgets/driver_student_list.dart';

class AssistantDashboardScreen extends StatefulWidget {
  const AssistantDashboardScreen({super.key});

  @override
  State<AssistantDashboardScreen> createState() => _AssistantDashboardScreenState();
}

class _AssistantDashboardScreenState extends State<AssistantDashboardScreen> {
  Timer? _autoRefreshTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DriverProvider>().loadDashboard();
    });
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (mounted) {
        context.read<DriverProvider>().loadDashboard();
      }
    });
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final driver = context.watch<DriverProvider>();
    final auth = context.watch<AuthProvider>();
    final data = driver.dashboardData;
    final user = auth.user;
    final vehicle = data?.vehicle;
    final route = data?.route;
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
            tooltip: 'In-Person Cash Fee Collection',
            icon: const Icon(Icons.payments_rounded, color: AppColors.vanAmber),
            onPressed: () => _showCashCollectionDialog(context),
          ),
          IconButton(
            tooltip: 'Report Delay or Incident',
            icon: const Icon(Icons.warning_amber_rounded, color: AppColors.warning),
            onPressed: () => _showIncidentSheet(context, driver),
          ),
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
                // Vehicle & Route Header
                if (vehicle != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    color: AppColors.primary,
                    child: Row(
                      children: [
                        const Icon(Icons.directions_bus_rounded, color: Colors.white70, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          vehicle['registrationNumber'] ?? 'WP NB-7842',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            vehicle['makeModel'] ?? 'Toyota HiAce',
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (route != null && route['stops'] is List)
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.map_rounded, color: AppColors.accent, size: 20),
                            tooltip: 'View Route Stops',
                            onPressed: () => _showRouteStopsDialog(context, route),
                          ),
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

  void _showIncidentSheet(BuildContext context, DriverProvider driver) {
    if (driver.activeTrip == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No active trip in progress to report incidents.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    DriverIncidentButton.showSheet(
      context,
      (type, title, description, delayMinutes) async {
        final ok = await driver.reportIncident(
          type: type,
          title: title,
          description: description,
          delayMinutes: delayMinutes,
        );
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(ok ? 'Incident reported — Parents & Admin notified' : 'Failed to report incident'),
              backgroundColor: ok ? AppColors.warning : AppColors.error,
            ),
          );
        }
      },
    );
  }

  void _showRouteStopsDialog(BuildContext context, Map<String, dynamic> route) {
    final stops = route['stops'] as List? ?? [];
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.alt_route_rounded, color: AppColors.primary),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                route['name'] ?? 'Route Stops',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Route Code: ${route['routeCode'] ?? 'VT-01'}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const Divider(height: 16),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: stops.length,
                  separatorBuilder: (context, index) => const Divider(height: 8),
                  itemBuilder: (context, i) {
                    final stop = stops[i] as Map<String, dynamic>;
                    final isSchool = stop['type'] == 'school_drop';
                    return ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 12,
                        backgroundColor: isSchool ? AppColors.accent.withValues(alpha: 0.2) : AppColors.primary.withValues(alpha: 0.1),
                        child: Text('${i + 1}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(
                        stop['name'] ?? 'Stop ${i + 1}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        'Scheduled: ${stop['scheduledTime'] ?? ''} ${stop['landmark'] != null ? '• ${stop['landmark']}' : ''}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _showCashCollectionDialog(BuildContext context) async {
    final driverService = DriverService();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Loading Unpaid Invoices for Van Students...'),
              ],
            ),
          ),
        ),
      ),
    );

    List<Map<String, dynamic>> cashInvoices = [];
    try {
      cashInvoices = await driverService.getCashPendingInvoices();
    } catch (_) {}

    if (!context.mounted) return;
    Navigator.pop(context); // Close loading

    if (!context.mounted) return;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.payments_rounded, color: AppColors.vanAmber),
              SizedBox(width: 8),
              Expanded(
                child: Text('In-Person Cash Fee Collections', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: cashInvoices.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      'All student transport fees for your van are up to date! No pending cash collections.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    ),
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'When a parent hands cash fee in person inside the van, tap "Confirm Cash Received" to issue instant digital receipt:',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      Flexible(
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: cashInvoices.length,
                          separatorBuilder: (context, index) => const Divider(height: 12),
                          itemBuilder: (context, i) {
                            final inv = cashInvoices[i];
                            final stu = inv['studentId'] as Map<String, dynamic>?;
                            final parent = inv['parentId'] as Map<String, dynamic>?;
                            final invId = inv['_id']?.toString() ?? '';
                            final amount = inv['amount'] ?? 7500;

                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppColors.vanAmber.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.vanAmber.withValues(alpha: 0.3)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        stu?['name'] ?? 'Student',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                      ),
                                      Text(
                                        'LKR ${amount.toString()}',
                                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.primary),
                                      ),
                                    ],
                                  ),
                                  Text(
                                    'Period: ${inv['monthYear'] ?? ''} • Invoice: ${inv['invoiceNumber'] ?? ''}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                  ),
                                  Text(
                                    'Parent: ${parent?['name'] ?? 'Guardian'} (${parent?['phone'] ?? ''})',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 10),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.accent,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      icon: const Icon(Icons.check_circle_rounded, size: 16),
                                      label: const Text('Confirm Cash Received 💵', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      onPressed: () async {
                                        Navigator.pop(ctx);
                                        final ok = await driverService.confirmCashPayment(invId);
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(
                                              content: Text(ok
                                                  ? '💵 Cash payment confirmed for ${stu?['name']}! Parent notified.'
                                                  : 'Failed to confirm cash payment'),
                                              backgroundColor: ok ? AppColors.success : AppColors.error,
                                            ),
                                          );
                                        }
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }
}
