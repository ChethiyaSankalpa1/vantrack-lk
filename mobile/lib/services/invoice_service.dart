import 'package:dio/dio.dart';
import '../core/errors/api_exception.dart';
import '../core/network/api_client.dart';
import '../models/invoice_model.dart';

class InvoiceService {
  final ApiClient _api = ApiClient();

  /// Get invoices with optional status filter
  Future<Map<String, dynamic>> getInvoices({String? status, String? studentId}) async {
    try {
      final query = <String, dynamic>{};
      if (status != null && status != 'all') query['status'] = status;
      if (studentId != null) query['studentId'] = studentId;

      final response = await _api.get('/invoices', queryParameters: query);
      final list = (response.data['data'] as List? ?? [])
          .map((json) => InvoiceModel.fromJson(json as Map<String, dynamic>))
          .toList();

      final summary = response.data['summary'] as Map<String, dynamic>? ?? {};

      return {
        'invoices': list,
        'summary': summary,
      };
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Get single invoice details
  Future<InvoiceModel> getInvoiceById(String id) async {
    try {
      final response = await _api.get('/invoices/$id');
      return InvoiceModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Upload Bank Transfer Slip
  Future<InvoiceModel> uploadReceipt(String id, String receiptUrl, {String? notes}) async {
    try {
      final response = await _api.post('/invoices/$id/receipt', data: {
        'receiptUrl': receiptUrl,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      });
      return InvoiceModel.fromJson(response.data['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Initiate PayHere checkout session
  Future<Map<String, dynamic>> initiatePayHere(String id) async {
    try {
      final response = await _api.post('/invoices/$id/payhere-checkout');
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Get active operator bank accounts
  Future<List<Map<String, dynamic>>> getActiveBankAccounts() async {
    try {
      final response = await _api.get('/bank-accounts/active');
      final list = response.data['data'] as List? ?? [];
      return list.map((item) => item as Map<String, dynamic>).toList();
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }

  /// Submit Bank Deposit Receipt Form
  Future<Map<String, dynamic>> submitBankDeposit({
    required String invoiceId,
    required String bankAccountId,
    required String depositorName,
    required String depositDate,
    String? depositReferenceNumber,
    required String receiptFileUrl,
    String? notes,
  }) async {
    try {
      final response = await _api.post('/invoices/$invoiceId/bank-deposit', data: {
        'bankAccountId': bankAccountId,
        'depositorName': depositorName,
        'depositDate': depositDate,
        if (depositReferenceNumber != null && depositReferenceNumber.isNotEmpty)
          'depositReferenceNumber': depositReferenceNumber,
        'receiptFileUrl': receiptFileUrl,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      });
      return response.data['data'] as Map<String, dynamic>;
    } on DioException catch (e) {
      throw ApiException.fromDioError(e);
    }
  }
}
