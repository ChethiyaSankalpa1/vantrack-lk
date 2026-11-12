import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../config/app_colors.dart';
import '../../../models/student_model.dart';
import '../../../models/trip_model.dart';

class DriverStudentList extends StatelessWidget {
  final List<StudentModel> students;
  final TripModel? activeTrip;
  final bool Function(String studentId) isBoarded;
  final bool Function(String studentId) isDropped;
  final Future<void> Function(String studentId) onMarkBoarded;
  final Future<void> Function(String studentId) onMarkDropped;
  final Future<void> Function(String studentId) onMarkAbsent;
  final Future<void> Function() onRefresh;

  const DriverStudentList({
    super.key,
    required this.students,
    required this.activeTrip,
    required this.isBoarded,
    required this.isDropped,
    required this.onMarkBoarded,
    required this.onMarkDropped,
    required this.onMarkAbsent,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // No active trip warning banner
          if (activeTrip == null)
            SliverToBoxAdapter(
              child: _buildNoActiveTripBanner(),
            ),

          // Header stats
          SliverToBoxAdapter(
            child: _buildStudentStats(),
          ),

          // Student list
          if (students.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.people_outline_rounded,
                        size: 56, color: AppColors.textMuted),
                    const SizedBox(height: 12),
                    const Text(
                      'No Students Assigned',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Students will appear here once\nassigned by the administrator.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _StudentCard(
                      student: students[index],
                      boarded: isBoarded(students[index].id),
                      dropped: isDropped(students[index].id),
                      tripActive: activeTrip != null,
                      activeTrip: activeTrip,
                      onBoarded: () => onMarkBoarded(students[index].id),
                      onDropped: () => onMarkDropped(students[index].id),
                      onAbsent: () => onMarkAbsent(students[index].id),
                    ),
                  ),
                  childCount: students.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildNoActiveTripBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.4)),
      ),
      child: const Row(
        children: [
          Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'No active trip — go to the Trips tab and start a trip to record attendance.',
              style: TextStyle(
                fontSize: 12,
                color: AppColors.warning,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentStats() {
    int boardedCount = 0;
    int droppedCount = 0;
    for (final s in students) {
      if (isBoarded(s.id)) boardedCount++;
      if (isDropped(s.id)) droppedCount++;
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: Row(
        children: [
          _buildStatChip('${students.length}', 'Total', AppColors.primary, Icons.people_rounded),
          const SizedBox(width: 8),
          _buildStatChip('$boardedCount', 'Boarded', AppColors.accent, Icons.login_rounded),
          const SizedBox(width: 8),
          _buildStatChip('$droppedCount', 'Dropped', AppColors.info, Icons.logout_rounded),
        ],
      ),
    );
  }

  Widget _buildStatChip(String count, String label, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  count,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentCard extends StatefulWidget {
  final StudentModel student;
  final bool boarded;
  final bool dropped;
  final bool tripActive;
  final TripModel? activeTrip;
  final Future<void> Function() onBoarded;
  final Future<void> Function() onDropped;
  final Future<void> Function() onAbsent;

  const _StudentCard({
    required this.student,
    required this.boarded,
    required this.dropped,
    required this.tripActive,
    this.activeTrip,
    required this.onBoarded,
    required this.onDropped,
    required this.onAbsent,
  });

  @override
  State<_StudentCard> createState() => _StudentCardState();
}

class _StudentCardState extends State<_StudentCard> {
  bool _busy = false;

  Future<void> _handleAction(Future<void> Function() action) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await action();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.student;
    final statusColor = _getStatusColor();
    final statusLabel = _getStatusLabel();
    final isAfternoon = widget.activeTrip?.tripType == 'afternoon_drop';
    final dropLabel = isAfternoon ? 'Drop Home' : 'Drop School';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: widget.boarded || widget.dropped
              ? statusColor.withValues(alpha: 0.4)
              : AppColors.cardBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: s.photoUrl != null
                  ? ClipOval(
                      child: Image.network(
                        s.photoUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => _buildInitialsAvatar(s.name),
                      ),
                    )
                  : _buildInitialsAvatar(s.name),
            ),
            const SizedBox(width: 12),

            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          s.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: const Icon(Icons.phone_in_talk_rounded, color: AppColors.accent, size: 18),
                        tooltip: 'Parent Contact Details',
                        onPressed: () => _showParentContactDialog(context, s),
                      ),
                      const SizedBox(width: 6),
                      // Status pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          statusLabel,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${s.schoolName} (${s.grade})',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(Icons.flight_takeoff_rounded, size: 11, color: AppColors.accent),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'Pickup: ${s.pickupLocation.address} (${s.pickupTime})',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      const Icon(Icons.flight_land_rounded, size: 11, color: AppColors.info),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'Drop: ${s.dropoffLocation.address} (${s.dropoffTime})',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                  // Action buttons
                  if (widget.tripActive) ...[
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _buildSmallButton(
                          label: 'Boarded',
                          icon: Icons.login_rounded,
                          color: AppColors.accent,
                          done: widget.boarded,
                          onPressed: widget.boarded || widget.dropped
                              ? null
                              : () => _handleAction(widget.onBoarded),
                        ),
                        const SizedBox(width: 6),
                        _buildSmallButton(
                          label: dropLabel,
                          icon: isAfternoon ? Icons.home_rounded : Icons.school_rounded,
                          color: AppColors.info,
                          done: widget.dropped,
                          onPressed: widget.dropped || (!widget.boarded)
                              ? null
                              : () => _handleAction(widget.onDropped),
                        ),
                        const SizedBox(width: 6),
                        _buildSmallButton(
                          label: 'Absent',
                          icon: Icons.person_off_rounded,
                          color: AppColors.error,
                          done: false,
                          onPressed: widget.boarded || widget.dropped
                              ? null
                              : () => _confirmAbsent(context),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            // Busy indicator
            if (_busy)
              const Padding(
                padding: EdgeInsets.only(left: 8, top: 2),
                child: SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.accent),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInitialsAvatar(String name) {
    final parts = name.trim().split(' ');
    final initials = parts.length >= 2
        ? '${parts.first[0]}${parts.last[0]}'
        : name.isNotEmpty
            ? name[0]
            : '?';
    return Center(
      child: Text(
        initials.toUpperCase(),
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildSmallButton({
    required String label,
    required IconData icon,
    required Color color,
    required bool done,
    required VoidCallback? onPressed,
  }) {
    return Expanded(
      child: SizedBox(
        height: 32,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: done ? color : color.withValues(alpha: 0.1),
            foregroundColor: done ? Colors.white : color,
            elevation: 0,
            padding: EdgeInsets.zero,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            side: BorderSide(color: color.withValues(alpha: 0.3)),
          ),
          onPressed: onPressed,
          icon: Icon(done ? Icons.check_rounded : icon, size: 13),
          label: Text(
            label,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }

  void _showParentContactDialog(BuildContext context, StudentModel student) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            const Icon(Icons.contact_phone_rounded, color: AppColors.accent),
            const SizedBox(width: 8),
            const Text('Parent Contact', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Student: ${student.name}',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
            ),
            const Divider(height: 16),
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: const Icon(Icons.person_rounded, color: AppColors.primary, size: 20),
              title: const Text('Guardian Name', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              subtitle: Text(
                student.parentName ?? 'Authorized Guardian',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: const Icon(Icons.phone_rounded, color: AppColors.success, size: 20),
              title: const Text('Primary Phone (Tap to Call)', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              subtitle: Text(
                student.parentPhone ?? '0771234567',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              trailing: const Icon(Icons.phone_forwarded_rounded, color: AppColors.success, size: 18),
              onTap: () async {
                final phone = student.parentPhone ?? '0771234567';
                final Uri uri = Uri(scheme: 'tel', path: phone.replaceAll(RegExp(r'[^\d+]'), ''));
                try {
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  } else {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                } catch (_) {}
              },
            ),
            if (student.parentEmergencyContact != null)
              ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 20),
                title: const Text('Emergency Hotline (Tap to Call)', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                subtitle: Text(
                  student.parentEmergencyContact!,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.error),
                ),
                trailing: const Icon(Icons.phone_forwarded_rounded, color: AppColors.error, size: 18),
                onTap: () async {
                  final phone = student.parentEmergencyContact!;
                  final Uri uri = Uri(scheme: 'tel', path: phone.replaceAll(RegExp(r'[^\d+]'), ''));
                  try {
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri);
                    } else {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  } catch (_) {}
                },
              ),
          ],
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

  void _confirmAbsent(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Mark as Absent?', style: TextStyle(fontSize: 16)),
        content: Text(
          'Mark ${widget.student.name} as absent for today\'s trip? '
          'Their parent will be notified.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(ctx);
              _handleAction(widget.onAbsent);
            },
            child: const Text('Mark Absent', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    if (widget.dropped) return AppColors.info;
    if (widget.boarded) return AppColors.accent;
    return AppColors.textMuted;
  }

  String _getStatusLabel() {
    if (widget.dropped) return 'DROPPED';
    if (widget.boarded) return 'BOARDED';
    return 'WAITING';
  }
}
