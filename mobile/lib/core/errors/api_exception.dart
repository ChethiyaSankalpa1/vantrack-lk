import 'package:dio/dio.dart';

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic details;

  ApiException({
    required this.message,
    this.statusCode,
    this.details,
  });

  factory ApiException.fromDioError(DioException error) {
    String message = 'An unexpected error occurred. Please try again.';
    int? code = error.response?.statusCode;
    dynamic details;

    if (error.response?.data is Map<String, dynamic>) {
      final data = error.response!.data as Map<String, dynamic>;
      message = data['message'] ?? data['error'] ?? message;
      details = data['details'];
    } else if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.sendTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timed out. Please check your internet connection.';
    } else if (error.type == DioExceptionType.connectionError) {
      message = 'Cannot connect to VanTrack LK server. Please ensure the backend is running.';
    }

    return ApiException(
      message: message,
      statusCode: code,
      details: details,
    );
  }

  @override
  String toString() => message;
}
