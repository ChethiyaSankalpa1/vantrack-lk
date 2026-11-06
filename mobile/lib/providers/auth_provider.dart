import 'package:flutter/material.dart';
import '../core/errors/api_exception.dart';
import '../core/storage/local_storage.dart';
import '../models/auth_user.dart';
import '../models/user_role.dart';
import '../services/auth_service.dart';

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
    } catch (_) {
      // If token expired, clear session
      // For offline resilience, if it's connection error keep cached user
      // but if 401 unauthorized, logout
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
