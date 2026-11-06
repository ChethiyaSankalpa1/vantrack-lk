class AppConstants {
  static const String appName = 'VanTrack LK';
  static const String appTagline = 'Smart School Transportation Sri Lanka';
  static const String appVersion = '1.0.0';

  // Base API URLs (configurable for Android Emulator 10.0.2.2 or physical device IP / localhost)
  // For physical phone on Wi-Fi: use PC's local IP (192.168.1.4)
  static const String defaultApiUrl = 'http://192.168.1.4:5000/api';
  static const String defaultSocketUrl = 'http://192.168.1.4:5000';

  // Shared Preferences Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserData = 'user_data';
  static const String keyUserRole = 'user_role';
  static const String keyHasSeenOnboarding = 'has_seen_onboarding';
  static const String keyBaseUrl = 'custom_base_url';

  // Sri Lanka specifics
  static const String currency = 'LKR';
  static const String countryCode = '+94';
}
