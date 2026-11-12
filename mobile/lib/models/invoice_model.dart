class InvoiceModel {
  final String id;
  final String invoiceNumber;
  final String parentId;
  final String studentId;
  final String studentName;
  final String schoolName;
  final String grade;
  final String monthYear; // e.g. "2026-11"
  final double amount;
  final String currency;
  final DateTime dueDate;
  final String status; // 'unpaid', 'pending_verification', 'paid', 'overdue'
  final String paymentMethod; // 'bank_transfer', 'payhere_online', 'cash_to_driver', 'none'
  final String? receiptUrl;
  final String? payherePaymentId;
  final DateTime? paidAt;
  final String? notes;

  const InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.parentId,
    required this.studentId,
    required this.studentName,
    required this.schoolName,
    required this.grade,
    required this.monthYear,
    required this.amount,
    this.currency = 'LKR',
    required this.dueDate,
    this.status = 'unpaid',
    this.paymentMethod = 'none',
    this.receiptUrl,
    this.payherePaymentId,
    this.paidAt,
    this.notes,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    final student = json['studentId'] is Map ? json['studentId'] as Map<String, dynamic> : null;
    return InvoiceModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      invoiceNumber: json['invoiceNumber'] ?? 'INV-0000',
      parentId: json['parentId'] is Map ? json['parentId']['_id']?.toString() ?? '' : json['parentId']?.toString() ?? '',
      studentId: student?['_id']?.toString() ?? json['studentId']?.toString() ?? '',
      studentName: student?['name'] ?? 'Assigned Student',
      schoolName: student?['schoolName'] ?? 'School',
      grade: student?['grade'] ?? '-',
      monthYear: json['monthYear'] ?? '2026-11',
      amount: (json['amount'] as num?)?.toDouble() ?? 7500.0,
      currency: json['currency'] ?? 'LKR',
      dueDate: json['dueDate'] != null ? DateTime.tryParse(json['dueDate'].toString()) ?? DateTime.now() : DateTime.now(),
      status: json['status'] ?? 'unpaid',
      paymentMethod: json['paymentMethod'] ?? 'none',
      receiptUrl: json['receiptUrl'],
      payherePaymentId: json['payherePaymentId'],
      paidAt: json['paidAt'] != null ? DateTime.tryParse(json['paidAt'].toString()) : null,
      notes: json['notes'],
    );
  }

  bool get isPaid => status == 'paid';
  bool get isPending => status == 'pending_verification';
  bool get isUnpaid => status == 'unpaid' || status == 'overdue';
}
