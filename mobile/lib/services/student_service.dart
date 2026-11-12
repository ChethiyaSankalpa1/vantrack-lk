import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../models/student_model.dart';

class StudentService {
  final ApiClient _api = ApiClient();

  /// Get all children linked to parent
  Future<List<StudentModel>> getStudents() async {
    try {
      final response = await _api.get('/students');
      final list = response.data['data'] as List;
      return list.map((e) => StudentModel.fromJson(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Get student details with driver & attendance history
  Future<Map<String, dynamic>> getStudentDetails(String studentId) async {
    try {
      final response = await _api.get('/students/$studentId');
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Add new child
  Future<StudentModel> createStudent({
    required String name,
    required String schoolName,
    required String grade,
    String? admissionNumber,
    String? photoUrl,
    String? pickupAddress,
    double? pickupLat,
    double? pickupLng,
    String? pickupTime,
  }) async {
    try {
      final payload = {
        'name': name.trim(),
        'schoolName': schoolName.trim(),
        'grade': grade.trim(),
        if (admissionNumber != null && admissionNumber.isNotEmpty)
          'admissionNumber': admissionNumber.trim(),
        'photoUrl': ?photoUrl,
        'pickupAddress': pickupAddress ?? 'Home Stop',
        'pickupLat': pickupLat ?? 6.8485,
        'pickupLng': pickupLng ?? 79.9267,
        'pickupTime': pickupTime ?? '06:30 AM',
      };

      final response = await _api.post('/students', data: payload);
      return StudentModel.fromJson(response.data['data']);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Parent reports child absence
  Future<Map<String, dynamic>> reportAbsence(
    String studentId,
    String reason, {
    required String absenceDate,
    String absenceType = 'full_day',
    String? additionalNote,
  }) async {
    try {
      final response = await _api.post(
        '/students/$studentId/absence-report',
        data: {
          'absenceDate': absenceDate,
          'absenceType': absenceType,
          'reason': reason,
          if (additionalNote != null && additionalNote.isNotEmpty)
            'additionalNote': additionalNote,
        },
      );
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Parent cancels pending absence report
  Future<bool> cancelAbsenceReport(String absenceId) async {
    try {
      await _api.patch('/students/absences/$absenceId/cancel');
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Upload student photo file to backend Cloudinary
  Future<String> uploadStudentPhoto(String filePath) async {
    try {
      final response = await _api.postMultipart(
        '/upload',
        filePath: filePath,
        queryParameters: {'type': 'student'},
      );
      final data = response.data['data'] as Map<String, dynamic>;
      return data['url'] as String;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
