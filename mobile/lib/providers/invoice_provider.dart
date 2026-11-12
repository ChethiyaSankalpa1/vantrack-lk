import 'package:flutter/material.dart';
import '../models/invoice_model.dart';
import '../services/invoice_service.dart';

class InvoiceProvider extends ChangeNotifier {
  final InvoiceService _service = InvoiceService();

  List<InvoiceModel> _invoices = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = false;
  String? _errorMessage;
  String _activeTab = 'all'; // 'all', 'unpaid', 'pending_verification', 'paid'
  bool _isPaymentProcessing = false;

  List<InvoiceModel> get invoices => _filteredInvoices;
  List<InvoiceModel> get allInvoices => _invoices;
  Map<String, dynamic> get summary => _summary;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get activeTab => _activeTab;
  bool get isPaymentProcessing => _isPaymentProcessing;

  double get totalOutstanding => (_summary['totalOutstanding'] as num?)?.toDouble() ?? 0.0;
  double get totalPaid => (_summary['totalPaid'] as num?)?.toDouble() ?? 0.0;
  int get unpaidCount => (_summary['unpaidCount'] as num?)?.toInt() ?? 0;

  List<InvoiceModel> get _filteredInvoices {
    if (_activeTab == 'all') return _invoices;
    return _invoices.where((inv) => inv.status == _activeTab).toList();
  }

  void setActiveTab(String tab) {
    _activeTab = tab;
    notifyListeners();
  }

  Future<void> loadInvoices({String? studentId}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _service.getInvoices(studentId: studentId);
      _invoices = result['invoices'] as List<InvoiceModel>;
      _summary = result['summary'] as Map<String, dynamic>;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> uploadBankSlip(String invoiceId, String receiptUrl, {String? notes}) async {
    _isPaymentProcessing = true;
    notifyListeners();

    try {
      final updated = await _service.uploadReceipt(invoiceId, receiptUrl, notes: notes);
      final index = _invoices.indexWhere((i) => i.id == invoiceId);
      if (index != -1) {
        _invoices[index] = updated;
      }
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isPaymentProcessing = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>?> getPayHereCheckoutParams(String invoiceId) async {
    _isPaymentProcessing = true;
    notifyListeners();

    try {
      return await _service.initiatePayHere(invoiceId);
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    } finally {
      _isPaymentProcessing = false;
      notifyListeners();
    }
  }
}
