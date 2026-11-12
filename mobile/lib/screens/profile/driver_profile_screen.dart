import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';

class DriverProfileScreen extends StatelessWidget {
  const DriverProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final driver = context.watch<DriverProvider>();
    final user = auth.user;
    final vehicle = driver.dashboardData?.vehicle;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Driver Profile'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Driver Information Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: AppColors.vanAmber.withValues(alpha: 0.15),
                    child: Text(
                      user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : 'D',
                      style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.vanAmber),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'Driver Name',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.vanAmber.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'School Van Driver (Captain)',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.vanAmber),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 12),
                  _buildProfileRow(Icons.phone_outlined, 'Phone Number', user?.phone ?? 'N/A'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.badge_outlined, 'Driving License', user?.licenseNumber ?? 'B-1234567'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.credit_card_outlined, 'NIC Number', user?.nicNumber ?? '198512345678'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Assigned Vehicle Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Assigned Vehicle Details', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  if (vehicle == null)
                    const Text('No vehicle currently assigned.', style: TextStyle(color: AppColors.textSecondary))
                  else ...[
                    _buildProfileRow(Icons.directions_bus_rounded, 'Registration Number', vehicle['registrationNumber'] ?? 'WP NB-7842'),
                    const SizedBox(height: 10),
                    _buildProfileRow(Icons.commute_rounded, 'Make & Model', vehicle['makeModel'] ?? 'Toyota HiAce KDH'),
                    const SizedBox(height: 10),
                    _buildProfileRow(Icons.event_seat_rounded, 'Seating Capacity', '${vehicle['seatingCapacity'] ?? 16} Students'),
                    if (vehicle['assistantId'] != null) ...[
                      const SizedBox(height: 10),
                      _buildProfileRow(
                        Icons.person_pin_circle_rounded,
                        'Van Assistant',
                        '${vehicle['assistantId'] is Map ? (vehicle['assistantId']['name'] ?? 'Assigned') : 'Assigned'}${vehicle['assistantId'] is Map && vehicle['assistantId']['phone'] != null ? ' (${vehicle['assistantId']['phone']})' : ''}',
                      ),
                    ],
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Log Out of Driver Portal', style: TextStyle(fontWeight: FontWeight.w700)),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (r) => false);
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textMuted),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
            Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ],
        ),
      ],
    );
  }
}
