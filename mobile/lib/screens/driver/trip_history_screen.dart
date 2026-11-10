import 'package:flutter/material.dart';
import '../../config/app_colors.dart';
import '../../core/network/api_client.dart';
import '../../models/trip_model.dart';

class TripHistoryScreen extends StatefulWidget {
  const TripHistoryScreen({super.key});

  @override
  State<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends State<TripHistoryScreen> {
  final ApiClient _api = ApiClient();
  bool _isLoading = true;
  String? _errorMessage;
  List<TripModel> _trips = [];

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  Future<void> _loadTrips() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _api.get('/driver/trips');
      final list = response.data['data'] as List? ?? [];
      setState(() {
        _trips = list.map((json) => TripModel.fromJson(json as Map<String, dynamic>)).toList();
      });
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Trip History & Logs'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                      const SizedBox(height: 12),
                      Text(_errorMessage!),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _loadTrips, child: const Text('Retry')),
                    ],
                  ),
                )
              : _trips.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.history_rounded, size: 56, color: AppColors.textMuted),
                          SizedBox(height: 12),
                          Text(
                            'No Past Trips Found',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Completed trips will appear here with full GPS and attendance records.',
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadTrips,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _trips.length,
                        itemBuilder: (ctx, index) {
                          final trip = _trips[index];
                          return _buildTripCard(trip);
                        },
                      ),
                    ),
    );
  }

  Widget _buildTripCard(TripModel trip) {
    final isMorning = trip.tripType == 'morning_pickup' || trip.tripType == 'morning';
    final routeName = trip.route?['name'] ?? 'Assigned School Route';
    final vehiclePlate = trip.vehicle?['registrationNumber'] ?? 'WP NB-XXXX';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: isMorning
                      ? AppColors.vanAmber.withValues(alpha: 0.15)
                      : AppColors.info.withValues(alpha: 0.15),
                  child: Icon(
                    isMorning ? Icons.wb_sunny_rounded : Icons.wb_twilight_rounded,
                    color: isMorning ? AppColors.vanAmber : AppColors.info,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip.displayTripType,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      Text(
                        routeName,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: trip.status == 'completed'
                        ? AppColors.success.withValues(alpha: 0.12)
                        : AppColors.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    trip.status.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: trip.status == 'completed' ? AppColors.success : AppColors.accent,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildInfoItem(Icons.directions_bus_rounded, vehiclePlate),
                if (trip.date != null)
                  _buildInfoItem(
                    Icons.calendar_today_rounded,
                    '${trip.date!.day}/${trip.date!.month}/${trip.date!.year}',
                  ),
                if (trip.delayMinutes > 0)
                  _buildInfoItem(Icons.timer_off_rounded, '+${trip.delayMinutes}m delay'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}
