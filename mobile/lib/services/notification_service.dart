import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationService {
  final ApiClient _api = ApiClient();

  /// Get notifications for logged-in user
  Future<Map<String, dynamic>> getNotifications({int page = 1, int limit = 20}) async {
    try {
      final response = await _api.get(
        '/notifications',
        queryParameters: {'page': page, 'limit': limit},
      );
      final list = (response.data['data'] as List? ?? [])
          .map((json) => NotificationModel.fromJson(json as Map<String, dynamic>))
          .toList();

      final unreadCount = (response.data['unreadCount'] as num?)?.toInt() ?? 0;

      return {
        'notifications': list,
        'unreadCount': unreadCount,
      };
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      await _api.put('/notifications/mark-read');
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Mark single notification as read
  Future<bool> markAsRead(String id) async {
    try {
      await _api.put('/notifications/$id/read');
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Register FCM Device Token for push notifications
  Future<bool> registerFcmToken(String token, {String device = 'android'}) async {
    try {
      await _api.post('/notifications/fcm-token', data: {
        'token': token,
        'device': device,
      });
      return true;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
