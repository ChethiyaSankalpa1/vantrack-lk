import 'dart:async';
import 'package:dio/dio.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_constants.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_storage.dart';

class VehicleTelemetry {
  final String tripId;
  final String vehicleId;
  final double latitude;
  final double longitude;
  final double speed; // km/h
  final double heading;
  final double accuracy;
  final DateTime timestamp;

  const VehicleTelemetry({
    required this.tripId,
    required this.vehicleId,
    required this.latitude,
    required this.longitude,
    required this.speed,
    required this.heading,
    required this.accuracy,
    required this.timestamp,
  });

  factory VehicleTelemetry.fromJson(Map<String, dynamic> json) {
    return VehicleTelemetry(
      tripId: json['tripId']?.toString() ?? '',
      vehicleId: json['vehicleId']?.toString() ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 6.9271,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 79.8612,
      speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 5.0,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : (json['recordedAt'] != null
              ? DateTime.tryParse(json['recordedAt'].toString()) ?? DateTime.now()
              : DateTime.now()),
    );
  }
}

class TrackingService {
  final ApiClient _api = ApiClient();
  io.Socket? _socket;

  // Stream controllers for real-time events
  final _telemetryController = StreamController<VehicleTelemetry>.broadcast();
  final _incidentController = StreamController<Map<String, dynamic>>.broadcast();
  final _attendanceController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStateController = StreamController<bool>.broadcast();

  Stream<VehicleTelemetry> get telemetryStream => _telemetryController.stream;
  Stream<Map<String, dynamic>> get incidentStream => _incidentController.stream;
  Stream<Map<String, dynamic>> get attendanceStream => _attendanceController.stream;
  Stream<bool> get connectionStateStream => _connectionStateController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Fetch initial live trip state from backend REST API
  Future<Map<String, dynamic>?> getLiveTrip() async {
    try {
      final response = await _api.get('/parent/live-trip');
      return response.data['data'] as Map<String, dynamic>?;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Connect Socket.IO client and join trip room
  void connectSocket({required String tripId, String? parentId}) {
    disconnectSocket();

    final customBase = LocalStorage.getBaseUrl();
    final socketUrl = customBase.isNotEmpty
        ? customBase.replaceAll(RegExp(r'/api/?$'), '')
        : AppConstants.defaultSocketUrl;

    final token = LocalStorage.getToken();

    _socket = io.io(
      socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionDelay(2000)
          .setReconnectionAttempts(10)
          .setExtraHeaders(token != null ? {'Authorization': 'Bearer $token'} : {})
          .build(),
    );

    _socket!.onConnect((_) {
      _connectionStateController.add(true);
      // Join trip room to receive updates
      _socket!.emit('parent:join-trip', tripId);
    });

    _socket!.onDisconnect((_) {
      _connectionStateController.add(false);
    });

    _socket!.onConnectError((err) {
      _connectionStateController.add(false);
    });

    // Listen for live vehicle location
    _socket!.on('trip:location-changed', (data) {
      if (data is Map<String, dynamic>) {
        _telemetryController.add(VehicleTelemetry.fromJson(data));
      }
    });

    // Listen for trip incidents
    _socket!.on('trip:incident', (data) {
      if (data is Map<String, dynamic>) {
        _incidentController.add(data);
      }
    });

    // Listen for child attendance events
    if (parentId != null) {
      _socket!.on('parent:$parentId:attendance', (data) {
        if (data is Map<String, dynamic>) {
          _attendanceController.add(data);
        }
      });
    }

    _socket!.on('trip:attendance-update', (data) {
      if (data is Map<String, dynamic>) {
        _attendanceController.add(data);
      }
    });
  }

  void disconnectSocket() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnectSocket();
    _telemetryController.close();
    _incidentController.close();
    _attendanceController.close();
    _connectionStateController.close();
  }
}
