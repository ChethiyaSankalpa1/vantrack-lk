import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../models/user_role.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_button.dart';
import '../driver/assistant_dashboard_screen.dart';
import '../driver/driver_dashboard_screen.dart';
import '../parent/parent_dashboard_screen.dart';

class RoleRouterScreen extends StatelessWidget {
  const RoleRouterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    if (user == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              const Text('Authenticating session...'),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.pushReplacementNamed(context, AppRoutes.login);
                },
                child: const Text('Return to Login'),
              ),
            ],
          ),
        ),
      );
    }

    // Role-specific routing
    switch (user.role) {
      case UserRole.parent:
        return const ParentDashboardScreen();
      case UserRole.driver:
        return const DriverDashboardScreen();
      case UserRole.assistant:
        return const AssistantDashboardScreen();
      case UserRole.admin:
        return _buildTemporaryDashboard(
          context,
          title: 'Fleet Administration',
          subtitle: 'Welcome Administrator ${user.name}',
          roleBadge: 'Fleet Admin',
          badgeColor: Colors.deepPurple,
          icon: Icons.admin_panel_settings_rounded,
          nextStage: 'Fleet, Route & Vehicle Management',
        );
    }
  }

  Widget _buildTemporaryDashboard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required String roleBadge,
    required Color badgeColor,
    required IconData icon,
    required String nextStage,
  }) {
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded, color: AppColors.error),
            onPressed: () async {
              await authProvider.logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, AppRoutes.login);
              }
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: badgeColor.withValues(alpha: 0.15),
                      child: Icon(icon, size: 40, color: badgeColor),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        roleBadge,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: badgeColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),
                    _buildInfoRow('Email', user?.email ?? 'N/A'),
                    const SizedBox(height: 8),
                    _buildInfoRow('Mobile Phone', user?.phone ?? 'N/A'),
                    if (user?.address != null) ...[
                      const SizedBox(height: 8),
                      _buildInfoRow('Address', user!.address!),
                    ],
                    if (user?.licenseNumber != null) ...[
                      const SizedBox(height: 8),
                      _buildInfoRow('Driver License', user!.licenseNumber!),
                    ],
                    if (user?.nicNumber != null) ...[
                      const SizedBox(height: 8),
                      _buildInfoRow('NIC Number', user!.nicNumber!),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppColors.accent, size: 28),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Stage 1 Completed Successfully!',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Next: $nextStage',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              CustomButton(
                text: 'Sign Out Session',
                isOutlined: true,
                textColor: AppColors.error,
                backgroundColor: AppColors.error,
                onPressed: () async {
                  await authProvider.logout();
                  if (context.mounted) {
                    Navigator.pushReplacementNamed(context, AppRoutes.login);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
