import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../models/driver_dashboard_model.dart';

class DriverService {
  final ApiClient _api = ApiClient();

  Future<DriverDashboardData> getDashboardData() async {
    try {
      final response = await _api.get('/driver/dashboard');
      final data = response.data['data'] as Map<String, dynamic>;
      return DriverDashboardData.fromJson(data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<bool> startTrip(String tripId) async {
    try {
      await _api.post('/driver/trips/$tripId/start');
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<bool> endTrip(String tripId) async {
    try {
      await _api.post('/driver/trips/$tripId/end');
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<bool> updateLocation({
    required String tripId,
    required String vehicleId,
    required double latitude,
    required double longitude,
    double speed = 0,
    double heading = 0,
    double accuracy = 5,
  }) async {
    try {
      await _api.post('/driver/location', data: {
        'tripId': tripId,
        'vehicleId': vehicleId,
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'heading': heading,
        'accuracy': accuracy,
      });
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<bool> recordAttendance({
    required String studentId,
    required String tripId,
    required String status,
    String method = 'manual',
    double? latitude,
    double? longitude,
    String? address,
    String? notes,
  }) async {
    try {
      await _api.post('/attendance', data: {
        'studentId': studentId,
        'tripId': tripId,
        'status': status,
        'method': method,
        'latitude': ?latitude,
        'longitude': ?longitude,
        'address': ?address,
        'notes': ?notes,
      });
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<bool> scanQrAndRecordAttendance({
    required String qrCodeString,
    required String tripId,
    required String status,
  }) async {
    try {
      await _api.post('/attendance/qr-scan', data: {
        'qrCodeString': qrCodeString,
        'tripId': tripId,
        'status': status,
      });
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  Future<bool> reportIncident({
    required String tripId,
    required String vehicleId,
    required String type,
    required String title,
    required String description,
    int estimatedDelayMinutes = 15,
    String? photoUrl,
  }) async {
    try {
      await _api.post('/driver/incidents', data: {
        'tripId': tripId,
        'vehicleId': vehicleId,
        'type': type,
        'title': title,
        'description': description,
        'estimatedDelayMinutes': estimatedDelayMinutes,
        'photoUrl': ?photoUrl,
      });
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
