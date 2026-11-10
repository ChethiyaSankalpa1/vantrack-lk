import 'dart:async';
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import '../models/trip_model.dart';
import '../services/tracking_service.dart';

enum TrackingStatus { idle, loading, active, noActiveTrip, error }

class TrackingProvider extends ChangeNotifier {
  final TrackingService _service = TrackingService();

  TrackingStatus _status = TrackingStatus.idle;
  String? _errorMessage;
  bool _isSocketConnected = false;

  TripModel? _activeTrip;
  Map<String, dynamic>? _vehicle;
  Map<String, dynamic>? _driver;
  List<Map<String, dynamic>> _stops = [];
  List<Map<String, dynamic>> _todayAttendance = [];
  final List<Map<String, dynamic>> _incidents = [];

  VehicleTelemetry? _latestTelemetry;
  DateTime? _lastTelemetryReceivedAt;
  Timer? _staleCheckTimer;

  StreamSubscription? _telemetrySub;
  StreamSubscription? _incidentSub;
  StreamSubscription? _attendanceSub;
  StreamSubscription? _connSub;

  TrackingStatus get status => _status;
  String? get errorMessage => _errorMessage;
  bool get isSocketConnected => _isSocketConnected;

  TripModel? get activeTrip => _activeTrip;
  Map<String, dynamic>? get vehicle => _vehicle;
  Map<String, dynamic>? get driver => _driver;
  List<Map<String, dynamic>> get stops => _stops;
  List<Map<String, dynamic>> get todayAttendance => _todayAttendance;
  List<Map<String, dynamic>> get incidents => _incidents;
  VehicleTelemetry? get latestTelemetry => _latestTelemetry;

  LatLng? get vehiclePosition {
    if (_latestTelemetry != null) {
      return LatLng(_latestTelemetry!.latitude, _latestTelemetry!.longitude);
    }
    return null;
  }

  double get currentSpeed => _latestTelemetry?.speed ?? 0.0;
  double get currentHeading => _latestTelemetry?.heading ?? 0.0;

  bool get isStale {
    if (_lastTelemetryReceivedAt == null) return true;
    final diff = DateTime.now().difference(_lastTelemetryReceivedAt!);
    return diff.inSeconds > 45;
  }

  int get secondsSinceLastUpdate {
    if (_lastTelemetryReceivedAt == null) return 999;
    return DateTime.now().difference(_lastTelemetryReceivedAt!).inSeconds;
  }

  Future<void> initTracking({String? parentId}) async {
    _status = TrackingStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final data = await _service.getLiveTrip();
      if (data == null || data['trip'] == null) {
        _status = TrackingStatus.noActiveTrip;
        notifyListeners();
        return;
      }

      final tripJson = data['trip'] as Map<String, dynamic>;
      _activeTrip = TripModel.fromJson(tripJson);
      _vehicle = tripJson['vehicleId'] is Map ? tripJson['vehicleId'] as Map<String, dynamic> : null;
      _driver = tripJson['driverId'] is Map ? tripJson['driverId'] as Map<String, dynamic> : null;

      final route = tripJson['routeId'] as Map<String, dynamic>?;
      _stops = route != null && route['stops'] is List
          ? (route['stops'] as List).cast<Map<String, dynamic>>()
          : [];

      // Initial location if provided
      if (data['location'] != null) {
        _latestTelemetry = VehicleTelemetry.fromJson(data['location'] as Map<String, dynamic>);
        _lastTelemetryReceivedAt = _latestTelemetry?.timestamp ?? DateTime.now();
      }

      // Attendance
      if (data['attendance'] is List) {
        _todayAttendance = (data['attendance'] as List).cast<Map<String, dynamic>>();
      }

      _status = TrackingStatus.active;
      notifyListeners();

      // Subscribe to real-time socket events
      _setupSocketSubscriptions(_activeTrip!.id, parentId);
      _startStaleCheck();
    } catch (e) {
      _status = TrackingStatus.error;
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  void _setupSocketSubscriptions(String tripId, String? parentId) {
    _telemetrySub?.cancel();
    _incidentSub?.cancel();
    _attendanceSub?.cancel();
    _connSub?.cancel();

    _service.connectSocket(tripId: tripId, parentId: parentId);

    _connSub = _service.connectionStateStream.listen((connected) {
      _isSocketConnected = connected;
      notifyListeners();
    });

    _telemetrySub = _service.telemetryStream.listen((telemetry) {
      _latestTelemetry = telemetry;
      _lastTelemetryReceivedAt = DateTime.now();
      notifyListeners();
    });

    _incidentSub = _service.incidentStream.listen((incident) {
      _incidents.insert(0, incident);
      notifyListeners();
    });

    _attendanceSub = _service.attendanceStream.listen((att) {
      _todayAttendance.insert(0, att);
      notifyListeners();
    });
  }

  void _startStaleCheck() {
    _staleCheckTimer?.cancel();
    _staleCheckTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_status == TrackingStatus.active) {
        notifyListeners();
      }
    });
  }

  @override
  void dispose() {
    _staleCheckTimer?.cancel();
    _telemetrySub?.cancel();
    _incidentSub?.cancel();
    _attendanceSub?.cancel();
    _connSub?.cancel();
    _service.dispose();
    super.dispose();
  }
}
