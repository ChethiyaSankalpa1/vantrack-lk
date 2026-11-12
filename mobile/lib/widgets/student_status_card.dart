import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/app_colors.dart';
import '../models/parent_dashboard_model.dart';
import '../models/student_model.dart';

class StudentStatusCard extends StatelessWidget {
  final StudentModel student;
  final AttendanceBrief? todayAttendance;
  final ActiveTripBrief? activeTrip;
  final VoidCallback onLiveTrackPressed;

  const StudentStatusCard({
    super.key,
    required this.student,
    this.todayAttendance,
    this.activeTrip,
    required this.onLiveTrackPressed,
  });

  @override
  Widget build(BuildContext context) {
    final statusInfo = _computeStatus();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with Student Name, School & Status Badge
          Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: statusInfo.color.withValues(alpha: 0.15),
                  backgroundImage: student.photoUrl != null &&
                          student.photoUrl!.isNotEmpty
                      ? NetworkImage(student.photoUrl!)
                      : null,
                  child: student.photoUrl == null || student.photoUrl!.isEmpty
                      ? Text(
                          student.name.isNotEmpty
                              ? student.name[0].toUpperCase()
                              : 'S',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: statusInfo.color,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student.name,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        '${student.grade} • ${student.schoolName}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: statusInfo.color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: statusInfo.color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        statusInfo.shortLabel,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: statusInfo.color,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Status Highlight Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            decoration: BoxDecoration(
              color: statusInfo.color.withValues(alpha: 0.08),
              border: Border(
                top: BorderSide(color: statusInfo.color.withValues(alpha: 0.15)),
                bottom: BorderSide(color: statusInfo.color.withValues(alpha: 0.15)),
              ),
            ),
            child: Row(
              children: [
                Icon(statusInfo.icon, color: statusInfo.color, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        statusInfo.headline,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: statusInfo.color,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        statusInfo.subtext,
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

          // Bottom Action: Live Tracking button or route preview
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  Icons.watch_later_outlined,
                  size: 16,
                  color: AppColors.textMuted,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    statusInfo.timeInfo,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                TextButton.icon(
                  onPressed: onLiveTrackPressed,
                  icon: const Icon(Icons.near_me_rounded, size: 16),
                  label: const Text('Live Map'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.accentDark,
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  ({
    Color color,
    IconData icon,
    String shortLabel,
    String headline,
    String subtext,
    String timeInfo,
  }) _computeStatus() {
    if (todayAttendance?.status == 'absent') {
      return (
        color: AppColors.warning,
        icon: Icons.event_busy_rounded,
        shortLabel: 'Absent',
        headline: 'Reported Absent Today',
        subtext: todayAttendance?.notes ?? 'Parent notified driver of absence',
        timeInfo: 'Updated today',
      );
    }

    if (todayAttendance?.status == 'dropped_off') {
      final timeStr = DateFormat('hh:mm a').format(todayAttendance!.timestamp);
      return (
        color: AppColors.success,
        icon: Icons.check_circle_rounded,
        shortLabel: 'Safely Arrived',
        headline: 'Safely Dropped Off at School',
        subtext: 'Verified by driver at ${todayAttendance?.address ?? 'School Gate'}',
        timeInfo: 'Arrived at $timeStr',
      );
    }

    if (todayAttendance?.status == 'boarded') {
      final timeStr = DateFormat('hh:mm a').format(todayAttendance!.timestamp);
      return (
        color: Color(0xFF3B82F6),
        icon: Icons.directions_bus_rounded,
        shortLabel: 'On the Way',
        headline: 'Inside School Van (In Transit)',
        subtext: 'Boarded at ${todayAttendance?.address ?? 'Designated Stop'} (QR Verified)',
        timeInfo: 'Boarded at $timeStr',
      );
    }

    final isTripActive = activeTrip?.status == 'started' || activeTrip?.status == 'active';
    if (isTripActive) {
      final isAfternoon = activeTrip?.tripType == 'afternoon_drop';
      return (
        color: AppColors.vanAmber,
        icon: Icons.access_time_filled_rounded,
        shortLabel: 'Van En Route',
        headline: isAfternoon ? 'Afternoon Return Trip In Progress' : 'Morning Van Has Started Trip',
        subtext: 'Driver is servicing route stops. Estimated arrival soon.',
        timeInfo: isAfternoon
            ? 'Scheduled: ${student.dropoffLocation.scheduledTime}'
            : 'Scheduled: ${student.pickupLocation.scheduledTime}',
      );
    }

    // Default / Morning waiting state
    return (
      color: AppColors.textSecondary,
      icon: Icons.home_rounded,
      shortLabel: 'At Home',
      headline: 'Next Trip: Morning School Pickup',
      subtext: 'Pickup at ${student.pickupLocation.address}',
      timeInfo: 'Scheduled for ${student.pickupLocation.scheduledTime}',
    );
  }
}
