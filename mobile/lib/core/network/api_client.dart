import 'package:dio/dio.dart';
import '../storage/local_storage.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio _dio;

  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: LocalStorage.getBaseUrl(),
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Attach JWT token dynamically
          final token = LocalStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          // Dynamic baseUrl update if changed in settings
          options.baseUrl = LocalStorage.getBaseUrl();
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;

  // Helper GET
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get(path, queryParameters: queryParameters, options: options);
  }

  // Helper POST
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post(path, data: data, queryParameters: queryParameters, options: options);
  }

  // Helper PUT
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put(path, data: data, queryParameters: queryParameters, options: options);
  }

  // Helper PATCH
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.patch(path, data: data, queryParameters: queryParameters, options: options);
  }

  // Helper DELETE
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete(path, data: data, queryParameters: queryParameters, options: options);
  }

  // Helper Multipart Upload
  Future<Response> postMultipart(
    String path, {
    required String filePath,
    String fileField = 'file',
    Map<String, dynamic>? queryParameters,
  }) async {
    final fileName = filePath.split('/').last;
    final formData = FormData.fromMap({
      fileField: await MultipartFile.fromFile(filePath, filename: fileName),
    });
    return await _dio.post(
      path,
      data: formData,
      queryParameters: queryParameters,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
    );
  }
}
