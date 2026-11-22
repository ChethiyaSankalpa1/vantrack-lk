import 'package:flutter/material.dart';
import '../models/invoice_model.dart';
import '../services/invoice_service.dart';

class InvoiceProvider extends ChangeNotifier {
  InvoiceProvider({InvoiceService? service}) : _service = service ?? InvoiceService();

  final InvoiceService _service;

  List<InvoiceModel> _invoices = [];
  Map<String, dynamic> _summary = {};
  bool _isLoading = false;
  String? _errorMessage;
  String _activeTab = 'all'; // 'all', 'unpaid', 'pending_verification', 'paid'
  bool _isPaymentProcessing = false;
  Map<String, dynamic>? _savedCard;
  bool _isCardLoading = false;

  List<InvoiceModel> get invoices => _filteredInvoices;
  List<InvoiceModel> get allInvoices => _invoices;
  Map<String, dynamic> get summary => _summary;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get activeTab => _activeTab;
  bool get isPaymentProcessing => _isPaymentProcessing;
  Map<String, dynamic>? get savedCard => _savedCard;
  bool get hasSavedCard => _savedCard != null;
  bool get isCardLoading => _isCardLoading;

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

  Future<List<Map<String, dynamic>>> getActiveBankAccounts() async {
    try {
      return await _service.getActiveBankAccounts();
    } catch (e) {
      _errorMessage = e.toString();
      return [];
    }
  }

  Future<bool> submitBankDeposit({
    required String invoiceId,
    required String bankAccountId,
    required String depositorName,
    required String depositDate,
    String? depositReferenceNumber,
    required String receiptFileUrl,
    String? notes,
  }) async {
    _isPaymentProcessing = true;
    notifyListeners();

    try {
      await _service.submitBankDeposit(
        invoiceId: invoiceId,
        bankAccountId: bankAccountId,
        depositorName: depositorName,
        depositDate: depositDate,
        depositReferenceNumber: depositReferenceNumber,
        receiptFileUrl: receiptFileUrl,
        notes: notes,
      );
      await loadInvoices();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isPaymentProcessing = false;
      notifyListeners();
    }
  }

  /// Load the parent's tokenised (saved) card, if any.
  Future<void> loadSavedCard() async {
    _isCardLoading = true;
    notifyListeners();

    try {
      _savedCard = await _service.getSavedCard();
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isCardLoading = false;
      notifyListeners();
    }
  }

  /// Get the PayHere URL used to securely save (tokenise) a new card.
  Future<String?> createCardTokeniseUrl() async {
    try {
      return await _service.createCardTokeniseUrl();
    } catch (e) {
      _errorMessage = e.toString();
      return null;
    }
  }

  /// Remove the stored card.
  Future<bool> removeSavedCard() async {
    _isCardLoading = true;
    notifyListeners();

    try {
      await _service.deleteSavedCard();
      _savedCard = null;
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isCardLoading = false;
      notifyListeners();
    }
  }

  /// Charge the saved card for the full outstanding balance.
  /// Returns a map with `success` and a user-facing `message`.
  Future<Map<String, dynamic>> payOutstandingWithCard() async {
    _isPaymentProcessing = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _service.payOutstandingByCard();
      await loadInvoices();
      return {'success': true, ...result};
    } catch (e) {
      _errorMessage = e.toString();
      return {'success': false, 'message': e.toString()};
    } finally {
      _isPaymentProcessing = false;
      notifyListeners();
    }
  }
}
