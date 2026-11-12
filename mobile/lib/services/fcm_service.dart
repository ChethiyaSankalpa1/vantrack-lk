import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'notification_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('[FCM Background Message] ${message.messageId}');
}

class FcmService {
  static final NotificationService _notificationService = NotificationService();
  static bool _isInitialized = false;

  /// Initialize Firebase & Firebase Cloud Messaging
  static Future<void> init() async {
    if (_isInitialized) return;

    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;

      // Request notification permissions (Android 13+ and iOS)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');

      // Get device FCM token
      final token = await messaging.getToken();
      if (token != null) {
        debugPrint('[FCM Token] $token');
        await _notificationService.registerFcmToken(token);
      }

      // Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        _notificationService.registerFcmToken(newToken);
      });

      // Handle foreground notifications
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM Foreground Message] ${message.notification?.title}: ${message.notification?.body}');
      });

      // Handle notification opened by user
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM Notification Opened] ${message.data}');
      });

      _isInitialized = true;
    } catch (e) {
      debugPrint('[FCM Init Warning] Running without Firebase credentials or in test mode: $e');
    }
  }
}
