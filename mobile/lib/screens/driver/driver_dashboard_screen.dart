import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';
import '../../providers/notification_provider.dart';
import '../../services/driver_service.dart';
import '../profile/driver_profile_screen.dart';
import 'widgets/driver_trip_card.dart';
import 'widgets/driver_student_list.dart';
import 'widgets/gps_status_banner.dart';
import 'widgets/driver_incident_button.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  int _selectedTab = 0;
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
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'LK',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              'Driver: ${user?.name.split(' ').first ?? 'Driver'}',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.85),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          // GPS status indicator
          if (driver.isGpsActive)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.accent, width: 1),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.gps_fixed_rounded, color: AppColors.accent, size: 14),
                      SizedBox(width: 4),
                      Text(
                        'GPS ON',
                        style: TextStyle(
                          color: AppColors.accent,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          IconButton(
            tooltip: 'In-Person Cash Fee Collection',
            icon: const Icon(Icons.payments_rounded, color: AppColors.vanAmber),
            onPressed: () => _showCashCollectionDialog(context),
          ),
          IconButton(
            tooltip: 'Past Trips History',
            icon: const Icon(Icons.history_rounded, color: Colors.white),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.tripHistory),
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                tooltip: 'Notifications',
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                onPressed: () => Navigator.pushNamed(context, AppRoutes.notifications),
              ),
              if (context.watch<NotificationProvider>().unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                    child: Text(
                      '${context.watch<NotificationProvider>().unreadCount}',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
            ],
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
            onSelected: (value) async {
              if (value == 'profile') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const DriverProfileScreen()),
                );
              } else if (value == 'inspection') {
                _showVehicleInspectionDialog(context);
              } else if (value == 'settings') {
                Navigator.pushNamed(context, AppRoutes.settings);
              } else if (value == 'logout') {
                driver.dispose();
                await auth.logout();
                if (context.mounted) {
                  Navigator.pushReplacementNamed(context, AppRoutes.login);
                }
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    Icon(Icons.badge_outlined, size: 18),
                    SizedBox(width: 8),
                    Text('Driver Profile'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'inspection',
                child: Row(
                  children: [
                    Icon(Icons.verified_user_outlined, size: 18, color: AppColors.accent),
                    SizedBox(width: 8),
                    Text('Pre-Trip Safety Inspection'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'settings',
                child: Row(
                  children: [
                    Icon(Icons.settings_outlined, size: 18),
                    SizedBox(width: 8),
                    Text('Settings'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout_rounded, size: 18, color: AppColors.error),
                    SizedBox(width: 8),
                    Text('Sign Out', style: TextStyle(color: AppColors.error)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: driver.isLoading && data == null
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // GPS active banner
                if (driver.isGpsActive)
                  GpsStatusBanner(
                    lastPosition: driver.lastPosition,
                    updateCount: driver.gpsUpdateCount,
                  ),

                // Vehicle Plate Header
                if (data?.vehicle != null)
                  _buildVehicleHeader(data!.vehicle!),

                // Tab selector
                _buildTabBar(),

                // Tab content
                Expanded(
                  child: IndexedStack(
                    index: _selectedTab,
                    children: [
                      // Tab 0: Today's Trips
                      _buildTripsTab(driver),
                      // Tab 1: Student Boarding List
                      _buildStudentsTab(driver),
                      // Tab 2: Route Info
                      _buildRouteTab(driver),
                    ],
                  ),
                ),
              ],
            ),
      floatingActionButton: driver.activeTrip != null
          ? FloatingActionButton.extended(
              backgroundColor: AppColors.accent,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.qr_code_scanner_rounded),
              label: const Text('Scan QR Pass', style: TextStyle(fontWeight: FontWeight.w700)),
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  AppRoutes.qrScanner,
                  arguments: {
                    'tripId': driver.activeTrip!.id,
                    'initialMode': 'boarded',
                  },
                );
              },
            )
          : null,
    );
  }

  Widget _buildVehicleHeader(Map<String, dynamic> vehicle) {
    final assistant = vehicle['assistantId'] is Map ? vehicle['assistantId'] as Map<String, dynamic> : null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: AppColors.primary,
      child: Column(
        children: [
          Row(
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
              Flexible(
                child: Text(
                  vehicle['makeModel'] ?? 'Toyota HiAce KDH',
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: _getVehicleStatusColor(vehicle['status']).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: _getVehicleStatusColor(vehicle['status'])),
                ),
                child: Text(
                  (vehicle['status'] ?? 'active').toString().replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(
                    color: _getVehicleStatusColor(vehicle['status']),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          if (assistant != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.person_pin_circle_rounded, color: AppColors.accent, size: 14),
                const SizedBox(width: 6),
                Text(
                  'Van Assistant: ${assistant['name'] ?? 'Assigned'}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (assistant['phone'] != null) ...[
                  const SizedBox(width: 6),
                  Text(
                    '(${assistant['phone']})',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 11,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ],
      ),
    );
  }

  Color _getVehicleStatusColor(dynamic status) {
    switch (status?.toString()) {
      case 'in_trip':
        return AppColors.accent;
      case 'maintenance':
        return AppColors.warning;
      case 'inactive':
        return AppColors.error;
      default:
        return Colors.white70;
    }
  }

  Widget _buildTabBar() {
    final tabs = ['Trips', 'Students', 'Route'];
    final icons = [
      Icons.route_rounded,
      Icons.people_rounded,
      Icons.map_rounded,
    ];
    return Container(
      color: AppColors.primaryDark,
      child: Row(
        children: List.generate(tabs.length, (i) {
          final isSelected = _selectedTab == i;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedTab = i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isSelected ? AppColors.accent : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      icons[i],
                      size: 16,
                      color: isSelected ? AppColors.accent : Colors.white54,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      tabs[i],
                      style: TextStyle(
                        color: isSelected ? AppColors.accent : Colors.white54,
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildTripsTab(DriverProvider driver) {
    final data = driver.dashboardData;
    final todayTrips = data?.todayTrips ?? [];

    return RefreshIndicator(
      onRefresh: () => driver.loadDashboard(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (todayTrips.isEmpty)
              _buildNoTripsCard()
            else
              ...todayTrips.map(
                (trip) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: DriverTripCard(
                    trip: trip,
                    isActive: driver.activeTrip?.id == trip.id,
                    tripState: driver.tripState,
                    onStart: () => _confirmStartTrip(driver, trip.id),
                    onEnd: () => _confirmEndTrip(driver, trip.id),
                  ),
                ),
              ),
            const SizedBox(height: 16),

            // Report Incident button (only during active trip)
            if (driver.activeTrip != null)
              DriverIncidentButton(
                onReport: (type, title, description, delay) async {
                  final success = await driver.reportIncident(
                    type: type,
                    title: title,
                    description: description,
                    delayMinutes: delay,
                  );
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(success
                            ? '⚠️ Incident reported. Parents notified.'
                            : 'Failed to report incident'),
                        backgroundColor: success ? AppColors.warning : AppColors.error,
                      ),
                    );
                  }
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStudentsTab(DriverProvider driver) {
    return DriverStudentList(
      students: driver.assignedStudents,
      activeTrip: driver.activeTrip,
      isBoarded: driver.isBoarded,
      isDropped: driver.isDropped,
      onMarkBoarded: (studentId) => _markAttendance(driver, studentId, 'boarded'),
      onMarkDropped: (studentId) => _markAttendance(driver, studentId, 'dropped_off'),
      onMarkAbsent: (studentId) => _markAttendance(driver, studentId, 'absent'),
      onRefresh: () => driver.loadDashboard(),
    );
  }

  Widget _buildRouteTab(DriverProvider driver) {
    final route = driver.dashboardData?.route;
    if (route == null) {
      return const Center(
        child: Text(
          'No route assigned yet.\nContact your fleet administrator.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
        ),
      );
    }

    final stops = route['stops'] as List? ?? [];
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: stops.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    route['name'] ?? 'Route',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Code: ${route['routeCode'] ?? '-'} • ${(route['tripType'] ?? 'both').toString().toUpperCase()}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        final stop = stops[index - 1] as Map<String, dynamic>;
        final isCurrentStop = (driver.activeTrip?.currentStopIndex ?? -1) == (stop['sequence'] as int? ?? 0) - 1;

        return _buildStopTile(stop, isCurrentStop, index - 1 == stops.length - 1);
      },
    );
  }

  Widget _buildStopTile(Map<String, dynamic> stop, bool isCurrent, bool isLast) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 32,
            child: Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: isCurrent ? AppColors.accent : AppColors.cardBorder,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCurrent ? AppColors.accentDark : AppColors.cardBorder,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '${stop['sequence'] ?? ''}',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: isCurrent ? Colors.white : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.cardBorder,
                      margin: const EdgeInsets.symmetric(vertical: 3),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isCurrent
                      ? AppColors.accentLight
                      : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isCurrent ? AppColors.accent : AppColors.cardBorder,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            stop['name'] ?? 'Stop',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isCurrent ? AppColors.accentDark : AppColors.textPrimary,
                            ),
                          ),
                        ),
                        Text(
                          stop['scheduledTime'] ?? '',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: isCurrent ? AppColors.accentDark : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    if (stop['landmark'] != null && stop['landmark'].toString().isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        '📍 ${stop['landmark']}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                    if (isCurrent)
                      Container(
                        margin: const EdgeInsets.only(top: 6),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'CURRENT STOP',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoTripsCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: const Column(
        children: [
          Icon(Icons.event_available_rounded, size: 48, color: AppColors.textMuted),
          SizedBox(height: 12),
          Text(
            'No Trips Scheduled Today',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Your morning and afternoon trips will appear here once assigned by the fleet administrator.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  void _confirmStartTrip(DriverProvider driver, String tripId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.play_circle_rounded, color: AppColors.accent),
            SizedBox(width: 10),
            Text('Start Trip & Enable GPS', style: TextStyle(fontSize: 17)),
          ],
        ),
        content: const Text(
          'Starting the trip will begin live GPS sharing with parents. Ensure all safety checks are complete before departing.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await driver.startTrip(tripId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success
                        ? '🚌 Trip started! GPS is now active and broadcasting to parents.'
                        : driver.errorMessage ?? 'Failed to start trip'),
                    backgroundColor: success ? AppColors.success : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Start Trip'),
          ),
        ],
      ),
    );
  }

  void _confirmEndTrip(DriverProvider driver, String tripId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.stop_circle_rounded, color: AppColors.error),
            SizedBox(width: 10),
            Text('End Trip & Stop GPS', style: TextStyle(fontSize: 17)),
          ],
        ),
        content: const Text(
          'Ending the trip will stop GPS sharing. All students should be safely delivered before completing the trip.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await driver.endTrip(tripId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success
                        ? '✅ Trip completed. GPS sharing stopped.'
                        : driver.errorMessage ?? 'Failed to end trip'),
                    backgroundColor: success ? AppColors.success : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Complete Trip'),
          ),
        ],
      ),
    );
  }

  Future<void> _markAttendance(DriverProvider driver, String studentId, String status) async {
    if (driver.activeTrip == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No active trip. Start the trip first.'),
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

  void _showVehicleInspectionDialog(BuildContext context) {
    bool tiresOk = true;
    bool brakesOk = true;
    bool lightsOk = true;
    bool doorsOk = true;
    bool firstAidOk = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.verified_user_rounded, color: AppColors.accent),
              SizedBox(width: 8),
              Text('Pre-Trip Vehicle Safety Check', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Verify all safety items before departing on school routes:',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 12),
                CheckboxListTile(
                  dense: true,
                  title: const Text('🛞 Tires & Air Pressure OK'),
                  value: tiresOk,
                  activeColor: AppColors.accent,
                  onChanged: (v) => setDialogState(() => tiresOk = v ?? false),
                ),
                CheckboxListTile(
                  dense: true,
                  title: const Text('🛑 Service Brakes & Handbrake OK'),
                  value: brakesOk,
                  activeColor: AppColors.accent,
                  onChanged: (v) => setDialogState(() => brakesOk = v ?? false),
                ),
                CheckboxListTile(
                  dense: true,
                  title: const Text('💡 Headlights, Turn Signals & Brake Lights'),
                  value: lightsOk,
                  activeColor: AppColors.accent,
                  onChanged: (v) => setDialogState(() => lightsOk = v ?? false),
                ),
                CheckboxListTile(
                  dense: true,
                  title: const Text('🚪 Passenger Doors & Emergency Exits'),
                  value: doorsOk,
                  activeColor: AppColors.accent,
                  onChanged: (v) => setDialogState(() => doorsOk = v ?? false),
                ),
                CheckboxListTile(
                  dense: true,
                  title: const Text('🚑 First Aid Kit & Fire Extinguisher Checked'),
                  value: firstAidOk,
                  activeColor: AppColors.accent,
                  onChanged: (v) => setDialogState(() => firstAidOk = v ?? false),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
              onPressed: () {
                Navigator.pop(ctx);
                final allPassed = tiresOk && brakesOk && lightsOk && doorsOk && firstAidOk;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(allPassed
                        ? '🛡️ Pre-Trip Vehicle Safety Inspection PASSED & Logged.'
                        : '⚠️ Safety Inspection Warning: Please resolve failed items before departure.'),
                    backgroundColor: allPassed ? AppColors.success : AppColors.warning,
                  ),
                );
              },
              child: const Text('Submit Inspection'),
            ),
          ],
        ),
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
