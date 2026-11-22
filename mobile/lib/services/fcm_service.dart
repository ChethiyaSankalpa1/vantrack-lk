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
  static String? _cachedToken;

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
        _cachedToken = token;
        // NOTE: at app start the user is usually not authenticated yet, so this
        // call may be rejected by the API. syncTokenWithServer() is invoked again
        // right after login/registration to guarantee the token is stored.
        await _registerTokenSilently(token);
      }

      // Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        _cachedToken = newToken;
        _registerTokenSilently(newToken);
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

  /// Register an FCM token with the backend, swallowing authentication/network
  /// errors so a failure never interrupts app startup or token refresh.
  static Future<void> _registerTokenSilently(String token) async {
    try {
      await _notificationService.registerFcmToken(token);
    } catch (e) {
      debugPrint('[FCM Token] Registration deferred: $e');
    }
  }

  /// Re-register the device token with the backend once the user is
  /// authenticated. Must be called after a successful login/registration so the
  /// token is associated with the now logged-in account.
  static Future<void> syncTokenWithServer() async {
    try {
      final token = _cachedToken ?? await FirebaseMessaging.instance.getToken();
      if (token == null) return;
      _cachedToken = token;
      await _notificationService.registerFcmToken(token);
    } catch (e) {
      debugPrint('[FCM Token] Sync skipped: $e');
    }
  }
}
