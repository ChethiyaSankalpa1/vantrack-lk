import 'package:flutter/material.dart';
import '../../../config/app_colors.dart';
import '../../../models/trip_model.dart';
import '../../../providers/driver_provider.dart';

class DriverTripCard extends StatelessWidget {
  final TripModel trip;
  final bool isActive;
  final TripState tripState;
  final VoidCallback onStart;
  final VoidCallback onEnd;

  const DriverTripCard({
    super.key,
    required this.trip,
    required this.isActive,
    required this.tripState,
    required this.onStart,
    required this.onEnd,
  });

  @override
  Widget build(BuildContext context) {
    final isCompleted = trip.status == 'completed';
    final isCancelled = trip.status == 'cancelled';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isActive
              ? AppColors.accent
              : isCompleted
                  ? AppColors.success.withValues(alpha: 0.4)
                  : AppColors.cardBorder,
          width: isActive ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isActive
                ? AppColors.accent.withValues(alpha: 0.15)
                : Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isActive
                  ? AppColors.accent.withValues(alpha: 0.08)
                  : isCompleted
                      ? AppColors.success.withValues(alpha: 0.06)
                      : AppColors.primary.withValues(alpha: 0.04),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                // Trip type icon
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getTripTypeColor().withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    _getTripTypeIcon(),
                    color: _getTripTypeColor(),
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getTripTypeLabel(),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Trip ID: ${trip.id.substring(trip.id.length > 8 ? trip.id.length - 8 : 0)}',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(),
              ],
            ),
          ),

          // Body
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Time and stats row
                Row(
                  children: [
                    _buildInfoTile(
                      icon: Icons.schedule_rounded,
                      label: 'Departed',
                      value: trip.startTime != null
                          ? _formatTime(trip.startTime!)
                          : '--:--',
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    _buildInfoTile(
                      icon: Icons.flag_rounded,
                      label: 'Completed',
                      value: trip.endTime != null
                          ? _formatTime(trip.endTime!)
                          : '--:--',
                      color: AppColors.success,
                    ),
                    const SizedBox(width: 8),
                    _buildInfoTile(
                      icon: Icons.people_rounded,
                      label: 'Students',
                      value: '${trip.studentCount}',
                      color: AppColors.info,
                    ),
                  ],
                ),

                // Delay info
                if (trip.delayMinutes > 0) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.timer_off_rounded, size: 14, color: AppColors.warning),
                        const SizedBox(width: 6),
                        Text(
                          'Delayed ${trip.delayMinutes} min',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Action buttons
                if (!isCompleted && !isCancelled) ...[
                  const SizedBox(height: 14),
                  const Divider(height: 1),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      if (!isActive)
                        Expanded(
                          child: _buildActionButton(
                            label: 'Start Trip',
                            icon: Icons.play_circle_rounded,
                            color: AppColors.accent,
                            isLoading: tripState == TripState.starting,
                            onPressed: onStart,
                          ),
                        )
                      else ...[
                        Expanded(
                          child: _buildActionButton(
                            label: 'Complete',
                            icon: Icons.stop_circle_rounded,
                            color: AppColors.error,
                            isLoading: tripState == TripState.ending,
                            onPressed: onEnd,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge() {
    String label;
    Color color;
    IconData icon;

    if (isActive) {
      label = 'ACTIVE';
      color = AppColors.accent;
      icon = Icons.radio_button_on_rounded;
    } else {
      switch (trip.status) {
        case 'completed':
          label = 'DONE';
          color = AppColors.success;
          icon = Icons.check_circle_rounded;
          break;
        case 'cancelled':
          label = 'CANCELLED';
          color = AppColors.error;
          icon = Icons.cancel_rounded;
          break;
        default:
          label = 'SCHEDULED';
          color = AppColors.info;
          icon = Icons.pending_rounded;
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required bool isLoading,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 44,
      child: ElevatedButton.icon(
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
              )
            : Icon(icon, size: 18),
        label: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
        ),
      ),
    );
  }

  IconData _getTripTypeIcon() {
    switch (trip.tripType) {
      case 'morning':
        return Icons.wb_sunny_rounded;
      case 'afternoon':
        return Icons.wb_twilight_rounded;
      default:
        return Icons.directions_bus_rounded;
    }
  }

  Color _getTripTypeColor() {
    switch (trip.tripType) {
      case 'morning':
        return AppColors.vanAmber;
      case 'afternoon':
        return AppColors.info;
      default:
        return AppColors.primary;
    }
  }

  String _getTripTypeLabel() {
    switch (trip.tripType) {
      case 'morning':
        return '☀️ Morning Trip — Pickup';
      case 'afternoon':
        return '🌆 Afternoon Trip — Drop-off';
      default:
        return '🚌 School Trip';
    }
  }

  String _formatTime(DateTime dt) {
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}
