import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../core/storage/local_storage.dart';
import '../models/auth_user.dart';
import '../models/user_role.dart';

class AuthService {
  final ApiClient _api = ApiClient();

  /// Login with email or phone + password
  Future<({AuthUser user, String token})> login({
    required String identifier, // email or phone
    required String password,
  }) async {
    try {
      final response = await _api.post('/auth/login', data: {
        'identifier': identifier.trim(),
        'password': password,
      });

      final data = response.data['data'] ?? response.data;
      final token = data['token'] as String;
      final user = AuthUser.fromJson(data['user']);

      await LocalStorage.saveToken(token);
      await LocalStorage.saveUser(user);

      return (user: user, token: token);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Register a new user
  Future<({AuthUser user, String token})> register({
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
    try {
      final payload = {
        'name': name.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'password': password,
        'role': role.apiValue,
        if (address != null && address.isNotEmpty) 'address': address.trim(),
        if (emergencyContact != null && emergencyContact.isNotEmpty)
          'emergencyContact': emergencyContact.trim(),
        if (nicNumber != null && nicNumber.isNotEmpty) 'nicNumber': nicNumber.trim(),
        if (licenseNumber != null && licenseNumber.isNotEmpty)
          'licenseNumber': licenseNumber.trim(),
      };

      final response = await _api.post('/auth/register', data: payload);
      final data = response.data['data'] ?? response.data;
      final token = data['token'] as String;
      final user = AuthUser.fromJson(data['user']);

      await LocalStorage.saveToken(token);
      await LocalStorage.saveUser(user);

      return (user: user, token: token);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  /// Get current authenticated user profile
  Future<AuthUser> getCurrentUser() async {
    try {
      final response = await _api.get('/auth/me');
      final data = response.data['data'] ?? response.data;
      final user = AuthUser.fromJson(data['user'] ?? data);
      await LocalStorage.saveUser(user);
      return user;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Request password reset OTP
  Future<String> requestPasswordReset(String identifier) async {
    try {
      final response = await _api.post('/auth/forgot-password', data: {
        'identifier': identifier.trim(),
      });
      return response.data['message'] ?? 'Password reset instructions have been sent';
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Reset password with OTP
  Future<String> resetPassword({
    required String identifier,
    required String otp,
    required String newPassword,
  }) async {
    try {
      final response = await _api.post('/auth/reset-password', data: {
        'identifier': identifier.trim(),
        'otp': otp.trim(),
        'newPassword': newPassword,
      });
      return response.data['message'] ?? 'Password reset successfully';
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Logout and clear storage
  Future<void> logout() async {
    await LocalStorage.clearSession();
  }
}
