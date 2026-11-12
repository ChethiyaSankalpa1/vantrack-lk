import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../models/vehicle_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/parent_dashboard_provider.dart';
import '../../widgets/child_selector_bar.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/fee_status_card.dart';
import '../../widgets/quick_actions_grid.dart';
import '../../widgets/student_status_card.dart';
import '../../widgets/transit_schedule_card.dart';
import '../../widgets/vehicle_driver_card.dart';

class ParentDashboardScreen extends StatefulWidget {
  const ParentDashboardScreen({super.key});

  @override
  State<ParentDashboardScreen> createState() => _ParentDashboardScreenState();
}

class _ParentDashboardScreenState extends State<ParentDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ParentDashboardProvider>().loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final parentProvider = context.watch<ParentDashboardProvider>();
    final user = authProvider.user;

    final student = parentProvider.selectedStudent;
    final students = parentProvider.students;
    final isLoading = parentProvider.isLoading;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'VanTrack',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
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
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            Text(
              'Welcome, ${user?.name.split(' ').first ?? 'Parent'}',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Student Profile & QR',
            icon: const Icon(Icons.qr_code_rounded, color: AppColors.primary),
            onPressed: () {
              if (student != null) {
                Navigator.pushNamed(
                  context,
                  AppRoutes.studentDetails,
                  arguments: student,
                );
              }
            },
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                tooltip: 'Notifications',
                icon: const Icon(Icons.notifications_outlined, color: AppColors.primary),
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
            icon: const Icon(Icons.more_vert_rounded, color: AppColors.primary),
            onSelected: (value) async {
              if (value == 'profile') {
                Navigator.pushNamed(context, AppRoutes.profile);
              } else if (value == 'settings') {
                Navigator.pushNamed(context, AppRoutes.settings);
              } else if (value == 'logout') {
                await authProvider.logout();
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
                    Icon(Icons.person_outline_rounded, size: 18),
                    SizedBox(width: 8),
                    Text('My Profile'),
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
      body: RefreshIndicator(
        onRefresh: () => parentProvider.loadDashboard(),
        child: isLoading && students.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : students.isEmpty
                ? _buildEmptyState()
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Child switcher tabs
                        ChildSelectorBar(
                          students: students,
                          selectedIndex: parentProvider.selectedStudentIndex,
                          onSelected: (idx) => parentProvider.selectStudent(idx),
                          onAddChild: () => Navigator.pushNamed(
                            context,
                            '/students/add',
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Child transit status summary card
                        if (student != null)
                          StudentStatusCard(
                            student: student,
                            todayAttendance:
                                parentProvider.selectedStudentAttendance,
                            activeTrip: parentProvider.dashboardData?.activeTrip,
                            onLiveTrackPressed: () {
                              Navigator.pushNamed(context, AppRoutes.liveTracking);
                            },
                          ),
                        const SizedBox(height: 16),

                        // Vehicle and driver information
                        if (student != null)
                          VehicleDriverCard(
                            vehicle: student.assignedVehicle,
                            onCallDriver: () => _showCallCrewModal(student.assignedVehicle),
                          ),
                        const SizedBox(height: 16),

                        // Daily transit timeline schedule
                        if (student != null)
                          TransitScheduleCard(student: student),
                        const SizedBox(height: 16),

                        // Monthly transport fee card
                        FeeStatusCard(
                          invoice: parentProvider.dashboardData?.latestInvoice,
                          onViewInvoices: () {
                            Navigator.pushNamed(context, AppRoutes.invoices);
                          },
                        ),
                        const SizedBox(height: 20),

                        // Quick actions grid
                        QuickActionsGrid(
                          onLiveTrackingTap: () {
                            Navigator.pushNamed(context, AppRoutes.liveTracking);
                          },
                          onAttendanceTap: () {
                            Navigator.pushNamed(
                              context,
                              AppRoutes.attendance,
                              arguments: {
                                'studentId': student?.id,
                                'studentName': student?.name,
                              },
                            );
                          },
                          onInvoicesTap: () {
                            Navigator.pushNamed(context, AppRoutes.invoices);
                          },
                          onReportAbsenceTap: () {
                            Navigator.pushNamed(
                              context,
                              AppRoutes.reportAbsence,
                              arguments: student,
                            );
                          },
                        ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.accent.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.school_rounded,
                size: 64,
                color: AppColors.accent,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'No Children Registered Yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'Link your child\'s profile and school to receive live GPS van tracking, morning pickup alerts, and attendance notifications.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: 'Register Child Profile',
              icon: Icons.add_rounded,
              onPressed: () {
                Navigator.pushNamed(context, '/students/add');
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final cleanPhone = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final Uri launchUri = Uri(scheme: 'tel', path: cleanPhone);
    try {
      if (await canLaunchUrl(launchUri)) {
        await launchUrl(launchUri);
      } else {
        await launchUrl(launchUri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Opening phone dialer for $phoneNumber...'),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    }
  }

  void _showCallCrewModal(VehicleModel? vehicle) {
    final driver = vehicle?.driver;
    final assistant = vehicle?.assistant;

    final driverPhone = driver?.phone ?? '0783456789';
    final driverName = driver?.name ?? 'Sunil Shantha (Driver)';
    final assistantPhone = assistant?.phone ?? '0754567890';
    final assistantName = assistant?.name ?? 'Kamal Bandara (Assistant)';

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.cardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Call School Van Crew',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'Vehicle: ${vehicle?.registrationNumber ?? "WP NB-7842"} (${vehicle?.makeModel ?? "Toyota HiAce"})',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),

            // Call Driver
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  color: AppColors.accent,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.phone_rounded, color: Colors.white, size: 20),
              ),
              title: Text(driverName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: Text('Van Driver • $driverPhone', style: const TextStyle(fontSize: 12, color: AppColors.accentDark, fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
              onTap: () {
                Navigator.pop(ctx);
                _makePhoneCall(driverPhone);
              },
            ),

            if (assistant != null || assistantPhone.isNotEmpty) ...[
              const Divider(height: 16),
              // Call Assistant
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.phone_outlined, color: AppColors.primary, size: 20),
                ),
                title: Text(assistantName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('Van Assistant / Attendant • $assistantPhone', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600)),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
                onTap: () {
                  Navigator.pop(ctx);
                  _makePhoneCall(assistantPhone);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
