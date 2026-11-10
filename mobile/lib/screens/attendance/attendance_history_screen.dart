import 'package:flutter/material.dart';
import '../../config/app_colors.dart';
import '../../services/attendance_service.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  final String? studentId;
  final String? studentName;

  const AttendanceHistoryScreen({
    super.key,
    this.studentId,
    this.studentName,
  });

  @override
  State<AttendanceHistoryScreen> createState() => _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  final AttendanceService _service = AttendanceService();
  bool _isLoading = true;
  String? _errorMessage;
  List<Map<String, dynamic>> _records = [];
  String _selectedFilter = 'all'; // all, boarded, dropped_off, absent

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (widget.studentId != null) {
        _records = await _service.getStudentAttendance(widget.studentId!);
      } else {
        _records = [];
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<Map<String, dynamic>> get _filteredRecords {
    if (_selectedFilter == 'all') return _records;
    return _records.where((r) => r['status'] == _selectedFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.studentName != null
            ? '${widget.studentName}\'s Attendance'
            : 'Attendance History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadHistory,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: Colors.white,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('all', 'All Events (${_records.length})'),
                  const SizedBox(width: 8),
                  _buildFilterChip('boarded', 'Boarded'),
                  const SizedBox(width: 8),
                  _buildFilterChip('dropped_off', 'Dropped Off'),
                  const SizedBox(width: 8),
                  _buildFilterChip('absent', 'Absent'),
                ],
              ),
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.error_outline_rounded,
                                  size: 48, color: AppColors.error),
                              const SizedBox(height: 12),
                              Text(_errorMessage!, textAlign: TextAlign.center),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadHistory,
                                child: const Text('Try Again'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _filteredRecords.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.event_note_rounded,
                                    size: 56, color: AppColors.textMuted),
                                SizedBox(height: 12),
                                Text(
                                  'No Attendance Records Found',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                SizedBox(height: 6),
                                Text(
                                  'Logs appear automatically after each boarding and drop-off.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadHistory,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _filteredRecords.length,
                              itemBuilder: (ctx, index) {
                                return _buildRecordCard(_filteredRecords[index]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.cardBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildRecordCard(Map<String, dynamic> record) {
    final status = record['status']?.toString() ?? 'boarded';
    final timestamp = record['timestamp'] != null
        ? DateTime.tryParse(record['timestamp'].toString())
        : null;
    final method = record['method']?.toString() ?? 'manual';
    final location = record['location'] as Map<String, dynamic>?;

    final Color statusColor;
    final IconData statusIcon;
    final String statusLabel;

    switch (status) {
      case 'boarded':
        statusColor = AppColors.accent;
        statusIcon = Icons.login_rounded;
        statusLabel = 'Safely Boarded';
        break;
      case 'dropped_off':
        statusColor = AppColors.info;
        statusIcon = Icons.logout_rounded;
        statusLabel = 'Safely Dropped Off';
        break;
      case 'absent':
        statusColor = AppColors.error;
        statusIcon = Icons.person_off_rounded;
        statusLabel = 'Recorded Absent';
        break;
      default:
        statusColor = AppColors.textMuted;
        statusIcon = Icons.help_outline_rounded;
        statusLabel = status;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(statusIcon, color: statusColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        statusLabel,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              method == 'qr_scan'
                                  ? Icons.qr_code_rounded
                                  : Icons.touch_app_rounded,
                              size: 11,
                              color: AppColors.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              method == 'qr_scan' ? 'QR PASS' : 'MANUAL',
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  if (timestamp != null)
                    Text(
                      _formatDate(timestamp),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  if (location?['address'] != null &&
                      location!['address'].toString().isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 14, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            location['address'].toString(),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final hour = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    final month = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ][dt.month - 1];
    return '$hour:$min • ${dt.day} $month ${dt.year}';
  }
}
