import 'dart:io';
import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';

class UploadService {
  final ApiClient _api = ApiClient();

  /// Upload image or document to Cloudinary via backend
  /// [type] can be 'avatar', 'student', 'receipt', 'license', 'vehicle', 'incident'
  Future<({String url, String publicId})> uploadFile({
    required File file,
    String type = 'general',
  }) async {
    try {
      final fileName = file.path.split(Platform.pathSeparator).last;

      final formData = FormData.fromMap({
        'type': type,
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await _api.post(
        '/upload',
        data: formData,
        queryParameters: {'type': type},
      );

      final data = response.data['data'] as Map<String, dynamic>;
      return (
        url: data['url'] as String,
        publicId: data['publicId'] as String,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Upload raw bytes (useful for web or captured camera bytes)
  Future<({String url, String publicId})> uploadBytes({
    required List<int> bytes,
    required String fileName,
    String type = 'general',
  }) async {
    try {
      final formData = FormData.fromMap({
        'type': type,
        'file': MultipartFile.fromBytes(
          bytes,
          filename: fileName,
        ),
      });

      final response = await _api.post(
        '/upload',
        data: formData,
        queryParameters: {'type': type},
      );

      final data = response.data['data'] as Map<String, dynamic>;
      return (
        url: data['url'] as String,
        publicId: data['publicId'] as String,
      );
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Delete uploaded file by Cloudinary publicId
  Future<bool> deleteFile(String publicId) async {
    try {
      await _api.delete('/upload', data: {'publicId': publicId});
      return true;
    } catch (_) {
      return false;
    }
  }
}
