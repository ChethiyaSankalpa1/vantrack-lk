import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/tracking_provider.dart';
import '../trip/trip_details_screen.dart';

class LiveTrackingScreen extends StatefulWidget {
  const LiveTrackingScreen({super.key});

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> {
  final MapController _mapController = MapController();
  bool _hasCenteredOnVehicle = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      context.read<TrackingProvider>().initTracking(parentId: user?.id);
    });
  }

  void _centerOnVehicle(LatLng position) {
    _mapController.move(position, 15.5);
  }

  @override
  Widget build(BuildContext context) {
    final tracking = context.watch<TrackingProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Live GPS Tracking'),
        actions: [
          // Socket.IO Status Badge
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: tracking.isSocketConnected
                      ? AppColors.accent.withValues(alpha: 0.15)
                      : AppColors.warning.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: tracking.isSocketConnected ? AppColors.accent : AppColors.warning,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: tracking.isSocketConnected ? AppColors.accent : AppColors.warning,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      tracking.isSocketConnected ? 'LIVE SOCKET' : 'POLLING',
                      style: TextStyle(
                        color: tracking.isSocketConnected ? AppColors.accent : AppColors.warning,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              final user = context.read<AuthProvider>().user;
              tracking.initTracking(parentId: user?.id);
            },
          ),
        ],
      ),
      body: _buildBody(tracking),
    );
  }

  Widget _buildBody(TrackingProvider tracking) {
    if (tracking.status == TrackingStatus.loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (tracking.status == TrackingStatus.noActiveTrip) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.directions_bus_filled_rounded,
                    size: 38, color: AppColors.primary),
              ),
              const SizedBox(height: 18),
              const Text(
                'No Active Trip In Progress',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              const Text(
                'Live tracking will activate as soon as the driver starts their morning pickup or afternoon drop-off route.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  final user = context.read<AuthProvider>().user;
                  tracking.initTracking(parentId: user?.id);
                },
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Check for Updates'),
              ),
            ],
          ),
        ),
      );
    }

    if (tracking.status == TrackingStatus.error) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.signal_wifi_bad_rounded, size: 48, color: AppColors.error),
            const SizedBox(height: 12),
            Text(tracking.errorMessage ?? 'Failed to load tracking data'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                final user = context.read<AuthProvider>().user;
                tracking.initTracking(parentId: user?.id);
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    // Auto-center map on vehicle the first time position arrives
    final vehiclePos = tracking.vehiclePosition ?? const LatLng(6.9271, 79.8612);
    if (!_hasCenteredOnVehicle && tracking.vehiclePosition != null) {
      _hasCenteredOnVehicle = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _centerOnVehicle(vehiclePos);
      });
    }

    // Prepare route points from stops
    final stopPoints = <LatLng>[];
    for (final s in tracking.stops) {
      final lat = (s['latitude'] as num?)?.toDouble();
      final lng = (s['longitude'] as num?)?.toDouble();
      if (lat != null && lng != null) {
        stopPoints.add(LatLng(lat, lng));
      }
    }

    return Stack(
      children: [
        // OpenStreetMap Tile Map Layer
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: vehiclePos,
            initialZoom: 14.5,
            minZoom: 5.0,
            maxZoom: 18.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'lk.vantrack.vantrack_lk',
            ),

            // Polyline connecting stops
            if (stopPoints.length >= 2)
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: stopPoints,
                    strokeWidth: 4.5,
                    color: AppColors.primary.withValues(alpha: 0.75),
                  ),
                ],
              ),

            // Stop Markers
            MarkerLayer(
              markers: [
                ...tracking.stops.asMap().entries.map((entry) {
                  final index = entry.key;
                  final s = entry.value;
                  final lat = (s['latitude'] as num?)?.toDouble() ?? 6.9271;
                  final lng = (s['longitude'] as num?)?.toDouble() ?? 79.8612;
                  final isCurrentStop = index == (tracking.activeTrip?.currentStopIndex ?? 0);

                  return Marker(
                    point: LatLng(lat, lng),
                    width: 32,
                    height: 32,
                    child: Container(
                      decoration: BoxDecoration(
                        color: isCurrentStop ? AppColors.accent : Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isCurrentStop ? AppColors.accentDark : AppColors.primary,
                          width: 2,
                        ),
                        boxShadow: const [
                          BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2)),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: isCurrentStop ? Colors.white : AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                  );
                }),

                // Live Vehicle Marker
                if (tracking.vehiclePosition != null)
                  Marker(
                    point: tracking.vehiclePosition!,
                    width: 50,
                    height: 50,
                    child: Transform.rotate(
                      angle: (tracking.currentHeading * (3.141592653589793 / 180)),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: AppColors.vanAmber.withValues(alpha: 0.25),
                              shape: BoxShape.circle,
                            ),
                          ),
                          Container(
                            width: 34,
                            height: 34,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black38,
                                  blurRadius: 6,
                                  offset: Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.directions_bus_rounded,
                              color: Colors.white,
                              size: 19,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),

        // Stale Location Alert Warning
        if (tracking.isStale)
          Positioned(
            top: 12,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.warning.withValues(alpha: 0.95),
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2)),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'GPS signal is delayed (${tracking.secondsSinceLastUpdate}s ago). Vehicle may be in a low-coverage area.',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Recenter Map Floating Action Button
        Positioned(
          right: 16,
          bottom: 240,
          child: FloatingActionButton.small(
            heroTag: 'recenter_gps',
            backgroundColor: Colors.white,
            foregroundColor: AppColors.primary,
            elevation: 4,
            tooltip: 'Recenter on School Van',
            onPressed: () {
              if (tracking.vehiclePosition != null) {
                _centerOnVehicle(tracking.vehiclePosition!);
              }
            },
            child: const Icon(Icons.my_location_rounded),
          ),
        ),

        // Bottom Public Transit Style Journey Card
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: _buildTransitJourneyCard(tracking),
        ),
      ],
    );
  }

  Widget _buildTransitJourneyCard(TrackingProvider tracking) {
    final vehicle = tracking.vehicle;
    final driver = tracking.driver;
    final trip = tracking.activeTrip;
    final stops = tracking.stops;
    final currentStopIndex = trip?.currentStopIndex ?? 0;
    final currentStop = currentStopIndex < stops.length ? stops[currentStopIndex] : null;

    final registrationNumber = vehicle?['registrationNumber'] ?? 'WP NB-7842';
    final vehicleModel = vehicle?['makeModel'] ?? 'Toyota HiAce KDH';
    final driverName = driver?['name'] ?? 'Driver';
    final driverPhone = driver?['phone'] ?? '+94 77 123 4567';

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 16, offset: Offset(0, -4)),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag Handle
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
            const SizedBox(height: 12),

            // Top Status Bar: Next Stop & Speed
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'NEXT STOP',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textMuted,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      currentStop?['name'] ?? 'In Transit',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.speed_rounded, size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        '${tracking.currentSpeed.toStringAsFixed(0)} km/h',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 14),

            // Driver & Van Info Row
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.person_rounded, color: AppColors.primary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        driverName,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      Text(
                        '$registrationNumber • $vehicleModel',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Call Driver',
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.accent.withValues(alpha: 0.15),
                    foregroundColor: AppColors.accentDark,
                  ),
                  icon: const Icon(Icons.phone_rounded, size: 20),
                  onPressed: () => _showContactDialog(driverName, driverPhone),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Button to View Full Route Stop Sequence
            SizedBox(
              height: 46,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: trip != null
                    ? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => TripDetailsScreen(trip: trip),
                          ),
                        );
                      }
                    : null,
                icon: const Icon(Icons.alt_route_rounded, size: 18),
                label: const Text(
                  'View Route Timeline & Stops',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showContactDialog(String name, String phone) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Contact $name'),
        content: Text('Phone number: $phone\n\nEnsure urgent calls do not distract the driver while operating the vehicle.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }
}
