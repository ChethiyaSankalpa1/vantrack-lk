import 'package:flutter/material.dart';
import '../../config/app_colors.dart';
import '../../models/trip_model.dart';
import '../../core/network/api_client.dart';

class TripDetailsScreen extends StatefulWidget {
  final TripModel trip;
  final bool isDriverView;
  final Function(int newStopIndex)? onStopAdvanced;

  const TripDetailsScreen({
    super.key,
    required this.trip,
    this.isDriverView = false,
    this.onStopAdvanced,
  });

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  final ApiClient _api = ApiClient();
  late int _currentStopIndex;
  bool _isAdvancing = false;

  @override
  void initState() {
    super.initState();
    _currentStopIndex = widget.trip.currentStopIndex;
  }

  List<Map<String, dynamic>> get _stops {
    final route = widget.trip.route;
    if (route != null && route['stops'] is List) {
      return (route['stops'] as List).cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<void> _advanceStop() async {
    if (_isAdvancing || _currentStopIndex >= _stops.length - 1) return;
    setState(() => _isAdvancing = true);

    final nextIndex = _currentStopIndex + 1;
    try {
      await _api.put('/driver/trips/${widget.trip.id}/stop', data: {
        'stopIndex': nextIndex,
      });

      setState(() => _currentStopIndex = nextIndex);
      widget.onStopAdvanced?.call(nextIndex);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('🚌 Advanced to: ${_stops[nextIndex]['name'] ?? 'Stop'}'),
            backgroundColor: AppColors.accent,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update stop: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isAdvancing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final stops = _stops;
    final routeName = widget.trip.route?['name'] ?? 'School Route';
    final vehiclePlate = widget.trip.vehicle?['registrationNumber'] ?? 'WP NB-7842';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Route & Journey Details'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Header Summary Card (Transit Style)
          Container(
            padding: const EdgeInsets.all(20),
            color: AppColors.primary,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        routeName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: widget.trip.isActive ? AppColors.accent : Colors.white24,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        widget.trip.isActive ? 'IN PROGRESS' : 'SCHEDULED',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.directions_bus_rounded, color: Colors.white70, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      vehiclePlate,
                      style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(width: 14),
                    const Icon(Icons.pin_drop_rounded, color: Colors.white70, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '${stops.length} Designated Stops',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Vertical Public Transit Style Timeline
          Expanded(
            child: stops.isEmpty
                ? const Center(
                    child: Text('No stops defined for this route.'),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: stops.length,
                    itemBuilder: (ctx, index) {
                      final stop = stops[index];
                      final isPassed = index < _currentStopIndex;
                      final isCurrent = index == _currentStopIndex;
                      final isLast = index == stops.length - 1;

                      return _buildTimelineItem(
                        stop: stop,
                        index: index,
                        isPassed: isPassed,
                        isCurrent: isCurrent,
                        isLast: isLast,
                      );
                    },
                  ),
          ),

          // Driver Action: Next Stop Advance
          if (widget.isDriverView && widget.trip.isActive && _currentStopIndex < stops.length - 1)
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: _isAdvancing ? null : _advanceStop,
                    icon: _isAdvancing
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.skip_next_rounded, color: Colors.white),
                    label: Text(
                      'Arrived at Next Stop (${stops[_currentStopIndex + 1]['name'] ?? ''})',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem({
    required Map<String, dynamic> stop,
    required int index,
    required bool isPassed,
    required bool isCurrent,
    required bool isLast,
  }) {
    final stopName = stop['name']?.toString() ?? 'Stop';
    final scheduledTime = stop['scheduledTime']?.toString() ?? '--:--';
    final landmark = stop['landmark']?.toString() ?? '';

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator column
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppColors.accent
                        : isPassed
                            ? AppColors.accent.withValues(alpha: 0.2)
                            : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCurrent || isPassed ? AppColors.accent : AppColors.cardBorder,
                      width: 2.5,
                    ),
                  ),
                  child: Center(
                    child: isPassed
                        ? const Icon(Icons.check_rounded, size: 14, color: AppColors.accent)
                        : isCurrent
                            ? const Icon(Icons.directions_bus_rounded, size: 14, color: Colors.white)
                            : Text(
                                '${index + 1}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2.5,
                      color: isPassed ? AppColors.accent : AppColors.cardBorder,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Stop Content Card
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isCurrent ? AppColors.accentLight.withValues(alpha: 0.4) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isCurrent ? AppColors.accent : AppColors.cardBorder,
                    width: isCurrent ? 2 : 1,
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
                            stopName,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: isCurrent ? AppColors.accentDark : AppColors.textPrimary,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            scheduledTime,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (landmark.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.near_me_outlined, size: 13, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              landmark,
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (isCurrent) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.accent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.radar_rounded, size: 12, color: Colors.white),
                            SizedBox(width: 6),
                            Text(
                              'CURRENT STOP',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
