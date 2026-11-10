import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';

class AttendanceService {
  final ApiClient _api = ApiClient();

  /// Record boarding or drop-off event
  Future<Map<String, dynamic>> recordAttendance({
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
      final response = await _api.post('/attendance', data: {
        'studentId': studentId,
        'tripId': tripId,
        'status': status,
        'method': method,
        'latitude': ?latitude,
        'longitude': ?longitude,
        'address': ?address,
        'notes': ?notes,
      });
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Scan student QR pass and record attendance
  Future<Map<String, dynamic>> scanQrCode({
    required String qrCodeString,
    required String tripId,
    required String status,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final response = await _api.post('/attendance/qr-scan', data: {
        'qrCodeString': qrCodeString,
        'tripId': tripId,
        'status': status,
        'latitude': ?latitude,
        'longitude': ?longitude,
      });
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Get attendance history for a student
  Future<List<Map<String, dynamic>>> getStudentAttendance(String studentId) async {
    try {
      final response = await _api.get('/attendance/student/$studentId');
      final list = response.data['data'] as List? ?? [];
      return list.cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Get attendance logs for a specific trip
  Future<List<Map<String, dynamic>>> getTripAttendance(String tripId) async {
    try {
      final response = await _api.get('/attendance/trip/$tripId');
      final list = response.data['data'] as List? ?? [];
      return list.cast<Map<String, dynamic>>();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
