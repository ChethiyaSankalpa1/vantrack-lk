import 'package:flutter/material.dart';
import '../core/errors/api_exception.dart';
import '../core/storage/local_storage.dart';
import '../models/auth_user.dart';
import '../models/user_role.dart';
import '../services/auth_service.dart';
import '../services/fcm_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthStatus _status = AuthStatus.initial;
  AuthUser? _user;
  String? _errorMessage;

  AuthStatus get status => _status;
  AuthUser? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated && _user != null;
  UserRole? get role => _user?.role;

  /// Check persisted token on app startup
  Future<void> checkAuthStatus() async {
    final token = LocalStorage.getToken();
    final savedUser = LocalStorage.getUser();

    if (token == null || token.isEmpty || savedUser == null) {
      _status = AuthStatus.unauthenticated;
      _user = null;
      notifyListeners();
      return;
    }

    // Load cached user first for instant display
    _user = savedUser;
    _status = AuthStatus.authenticated;
    notifyListeners();

    // Verify token with backend silently in background
    try {
      final freshUser = await _authService.getCurrentUser();
      _user = freshUser;
      notifyListeners();
    } on ApiException catch (e) {
      // If the token is rejected (401/403), the session is no longer valid:
      // clear it so the user is routed to the login screen.
      if (e.statusCode == 401 || e.statusCode == 403) {
        await logout();
      }
      // Otherwise (e.g. connection error) keep the cached user for offline
      // resilience - the app still works with locally stored data.
    } catch (_) {
      // Unknown error: keep cached user rather than logging the user out.
    }
  }

  /// Perform login
  Future<bool> login({
    required String identifier,
    required String password,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _authService.login(
        identifier: identifier,
        password: password,
      );
      _user = result.user;
      _status = AuthStatus.authenticated;
      notifyListeners();
      // Now that we have a valid session, associate the device push token
      // with this account (the startup attempt ran before auth).
      await FcmService.syncTokenWithServer();
      return true;
    } on ApiException catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Perform registration
  Future<bool> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required UserRole role,
    String? address,
    String? emergencyContact,
    String? nicNumber,
    String? licenseNumber,
  }) async {
    _status = AuthStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _authService.register(
        name: name,
        email: email,
        phone: phone,
        password: password,
        role: role,
        address: address,
        emergencyContact: emergencyContact,
        nicNumber: nicNumber,
        licenseNumber: licenseNumber,
      );
      _user = result.user;
      _status = AuthStatus.authenticated;
      notifyListeners();
      // Associate the device push token with the freshly created account.
      await FcmService.syncTokenWithServer();
      return true;
    } on ApiException catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _status = AuthStatus.unauthenticated;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Update user profile details & avatar photo
  Future<bool> updateProfile({
    String? name,
    String? phone,
    String? address,
    String? emergencyContact,
    String? nicNumber,
    String? licenseNumber,
    String? avatarUrl,
  }) async {
    _errorMessage = null;

    try {
      final updated = await _authService.updateProfile(
        name: name,
        phone: phone,
        address: address,
        emergencyContact: emergencyContact,
        nicNumber: nicNumber,
        licenseNumber: licenseNumber,
        avatarUrl: avatarUrl,
      );
      _user = updated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
