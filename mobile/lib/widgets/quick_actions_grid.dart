import 'package:flutter/material.dart';
import '../config/app_colors.dart';

class QuickActionsGrid extends StatelessWidget {
  final VoidCallback onLiveTrackingTap;
  final VoidCallback onAttendanceTap;
  final VoidCallback onInvoicesTap;
  final VoidCallback onReportAbsenceTap;

  const QuickActionsGrid({
    super.key,
    required this.onLiveTrackingTap,
    required this.onAttendanceTap,
    required this.onInvoicesTap,
    required this.onReportAbsenceTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionTile(
                  icon: Icons.navigation_rounded,
                  title: 'Live Tracking',
                  subtitle: 'Real-time GPS',
                  color: AppColors.accent,
                  onTap: onLiveTrackingTap,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionTile(
                  icon: Icons.fact_check_rounded,
                  title: 'Attendance',
                  subtitle: 'Daily Boarding Log',
                  color: const Color(0xFF3B82F6),
                  onTap: onAttendanceTap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildActionTile(
                  icon: Icons.receipt_long_rounded,
                  title: 'Fee Invoices',
                  subtitle: 'Receipts & History',
                  color: AppColors.vanAmber,
                  onTap: onInvoicesTap,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildActionTile(
                  icon: Icons.notification_important_outlined,
                  title: 'Report Absence',
                  subtitle: 'Notify School Van',
                  color: AppColors.error,
                  onTap: onReportAbsenceTap,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                Icon(
                  Icons.arrow_forward_rounded,
                  size: 14,
                  color: AppColors.textMuted.withValues(alpha: 0.6),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
