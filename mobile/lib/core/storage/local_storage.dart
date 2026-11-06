import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/app_constants.dart';
import '../../models/auth_user.dart';

class LocalStorage {
  static SharedPreferences? _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static SharedPreferences get prefs {
    if (_prefs == null) {
      throw Exception('LocalStorage must be initialized before access');
    }
    return _prefs!;
  }

  // Token Management
  static Future<bool> saveToken(String token) async {
    return await prefs.setString(AppConstants.keyAuthToken, token);
  }

  static String? getToken() {
    return prefs.getString(AppConstants.keyAuthToken);
  }

  static Future<bool> clearToken() async {
    return await prefs.remove(AppConstants.keyAuthToken);
  }

  // User Profile
  static Future<bool> saveUser(AuthUser user) async {
    return await prefs.setString(
      AppConstants.keyUserData,
      jsonEncode(user.toJson()),
    );
  }

  static AuthUser? getUser() {
    final raw = prefs.getString(AppConstants.keyUserData);
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return AuthUser.fromJson(map);
    } catch (_) {
      return null;
    }
  }

  static Future<bool> clearUser() async {
    return await prefs.remove(AppConstants.keyUserData);
  }

  // Onboarding
  static Future<bool> setOnboardingCompleted() async {
    return await prefs.setBool(AppConstants.keyHasSeenOnboarding, true);
  }

  static bool hasSeenOnboarding() {
    return prefs.getBool(AppConstants.keyHasSeenOnboarding) ?? false;
  }

  // Custom API Server URL (for dev testing)
  static Future<bool> setCustomBaseUrl(String url) async {
    return await prefs.setString(AppConstants.keyBaseUrl, url);
  }

  static String getBaseUrl() {
    return prefs.getString(AppConstants.keyBaseUrl) ?? AppConstants.defaultApiUrl;
  }

  // Clear session
  static Future<void> clearSession() async {
    await clearToken();
    await clearUser();
  }
}
