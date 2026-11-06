import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../models/parent_dashboard_model.dart';

class ParentService {
  final ApiClient _api = ApiClient();

  /// Fetch full aggregated parent dashboard data
  Future<ParentDashboardData> getDashboardData() async {
    try {
      final response = await _api.get('/parent/dashboard');
      final data = response.data['data'] as Map<String, dynamic>;
      return ParentDashboardData.fromJson(data);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }
}
