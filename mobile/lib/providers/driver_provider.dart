import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../core/errors/api_exception.dart';
import '../models/driver_dashboard_model.dart';
import '../models/student_model.dart';
import '../models/trip_model.dart';
import '../services/driver_service.dart';

enum TripState { idle, starting, active, ending }

class DriverProvider extends ChangeNotifier {
  final DriverService _service = DriverService();

  DriverDashboardData? _dashboardData;
  TripState _tripState = TripState.idle;
  bool _isLoading = false;
  String? _errorMessage;

  // GPS state
  bool _isGpsActive = false;
  Position? _lastPosition;
  Timer? _gpsTimer;
  int _gpsUpdateCount = 0;

  // Attendance tracking for active trip
  final Set<String> _boardedStudentIds = {};
  final Set<String> _droppedStudentIds = {};

  DriverDashboardData? get dashboardData => _dashboardData;
  TripState get tripState => _tripState;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isGpsActive => _isGpsActive;
  Position? get lastPosition => _lastPosition;
  int get gpsUpdateCount => _gpsUpdateCount;

  TripModel? get activeTrip => _dashboardData?.activeTrip;
  List<StudentModel> get assignedStudents => _dashboardData?.assignedStudents ?? [];

  bool isBoarded(String studentId) => _boardedStudentIds.contains(studentId);
  bool isDropped(String studentId) => _droppedStudentIds.contains(studentId);

  Future<void> loadDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _dashboardData = await _service.getDashboardData();

      // Load attendance state from trip attendance
      _boardedStudentIds.clear();
      _droppedStudentIds.clear();
      for (final att in _dashboardData?.tripAttendance ?? []) {
        final sId = att['studentId'] is Map
            ? att['studentId']['_id']?.toString()
            : att['studentId']?.toString();
        if (sId != null) {
          if (att['status'] == 'boarded') _boardedStudentIds.add(sId);
          if (att['status'] == 'dropped_off') _droppedStudentIds.add(sId);
        }
      }

      if (activeTrip?.isActive == true) {
        _tripState = TripState.active;
        if (!_isGpsActive) {
          _startGpsTracking();
        }
      } else {
        _tripState = TripState.idle;
        if (_isGpsActive) {
          _stopGpsTracking();
        }
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> startTrip(String tripId) async {
    _tripState = TripState.starting;
    _errorMessage = null;
    notifyListeners();

    try {
      // 1. Verify location service is enabled
      final isServiceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!isServiceEnabled) {
        _errorMessage = 'GPS / Location is turned off. Please enable device location.';
        _tripState = TripState.idle;
        notifyListeners();
        return false;
      }

      // 2. Verify / request location permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _errorMessage = 'Location permission is required to broadcast live GPS tracking.';
        _tripState = TripState.idle;
        notifyListeners();
        return false;
      }

      await _service.startTrip(tripId);
      await loadDashboard();
      _startGpsTracking();
      _tripState = TripState.active;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _tripState = TripState.idle;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      _tripState = TripState.idle;
      notifyListeners();
      return false;
    }
  }

  Future<bool> endTrip(String tripId) async {
    _tripState = TripState.ending;
    notifyListeners();

    try {
      await _service.endTrip(tripId);
      _stopGpsTracking();
      await loadDashboard();
      _tripState = TripState.idle;
      _boardedStudentIds.clear();
      _droppedStudentIds.clear();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _tripState = TripState.active;
      notifyListeners();
      return false;
    }
  }

  // GPS Tracking ─────────────────────────────────────────────
  void _startGpsTracking() {
    if (_isGpsActive && _gpsTimer != null) return;
    _isGpsActive = true;
    _gpsUpdateCount = 0;
    // Push immediate initial location right away
    _pushLocation();
    // Then schedule updates every 15 seconds
    _gpsTimer?.cancel();
    _gpsTimer = Timer.periodic(const Duration(seconds: 15), (_) => _pushLocation());
    notifyListeners();
  }

  void _stopGpsTracking() {
    _isGpsActive = false;
    _gpsTimer?.cancel();
    _gpsTimer = null;
    notifyListeners();
  }

  Future<void> _pushLocation() async {
    final trip = activeTrip;
    final vehicleId = _dashboardData?.vehicle?['_id']?.toString();
    if (trip == null || vehicleId == null) return;

    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 5,
        ),
      );

      _lastPosition = position;
      _gpsUpdateCount++;

      await _service.updateLocation(
        tripId: trip.id,
        vehicleId: vehicleId,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        heading: position.heading,
        accuracy: position.accuracy,
      );
      notifyListeners();
    } catch (_) {
      // Silently handle location errors — UI will show stale warning
    }
  }

  void updateStudentAttendance(String studentId, String status) {
    if (status == 'boarded') {
      _boardedStudentIds.add(studentId);
      _droppedStudentIds.remove(studentId);
    } else if (status == 'dropped_off') {
      _droppedStudentIds.add(studentId);
    } else if (status == 'absent') {
      _boardedStudentIds.remove(studentId);
      _droppedStudentIds.remove(studentId);
    }
    notifyListeners();
  }

  // Attendance ─────────────────────────────────────────────
  Future<bool> markBoarded(String studentId, {String? address}) async {
    final trip = activeTrip;
    if (trip == null) return false;

    final success = await _service.recordAttendance(
      studentId: studentId,
      tripId: trip.id,
      status: 'boarded',
      method: 'manual',
      address: address,
    );

    if (success) {
      _boardedStudentIds.add(studentId);
      notifyListeners();
    }
    return success;
  }

  Future<bool> markDropped(String studentId, {String? address}) async {
    final trip = activeTrip;
    if (trip == null) return false;

    final success = await _service.recordAttendance(
      studentId: studentId,
      tripId: trip.id,
      status: 'dropped_off',
      method: 'manual',
      address: address,
    );

    if (success) {
      _droppedStudentIds.add(studentId);
      notifyListeners();
    }
    return success;
  }

  Future<bool> markAbsent(String studentId, {String? notes}) async {
    final trip = activeTrip;
    if (trip == null) return false;

    return await _service.recordAttendance(
      studentId: studentId,
      tripId: trip.id,
      status: 'absent',
      notes: notes,
    );
  }

  Future<bool> scanQrCode(String qrCodeString, String status) async {
    final trip = activeTrip;
    if (trip == null) return false;

    final success = await _service.scanQrAndRecordAttendance(
      qrCodeString: qrCodeString,
      tripId: trip.id,
      status: status,
    );

    if (success && status == 'boarded') {
      // Note: We'd need the studentId here but QR returns it from backend
      // For simplicity, reload dashboard to get fresh attendance state
      await loadDashboard();
    }
    return success;
  }

  Future<bool> reportIncident({
    required String type,
    required String title,
    required String description,
    int delayMinutes = 15,
  }) async {
    final trip = activeTrip;
    final vehicleId = _dashboardData?.vehicle?['_id']?.toString();
    if (trip == null || vehicleId == null) return false;

    return await _service.reportIncident(
      tripId: trip.id,
      vehicleId: vehicleId,
      type: type,
      title: title,
      description: description,
      estimatedDelayMinutes: delayMinutes,
    );
  }

  @override
  void dispose() {
    _stopGpsTracking();
    super.dispose();
  }
}
