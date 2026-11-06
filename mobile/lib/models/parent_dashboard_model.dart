import 'student_model.dart';

class AttendanceBrief {
  final String id;
  final String studentId;
  final String status; // 'boarded', 'dropped_off', 'absent'
  final DateTime timestamp;
  final String? address;
  final String method;
  final String? notes;

  const AttendanceBrief({
    required this.id,
    required this.studentId,
    required this.status,
    required this.timestamp,
    this.address,
    this.method = 'manual',
    this.notes,
  });

  factory AttendanceBrief.fromJson(Map<String, dynamic> json) {
    return AttendanceBrief(
      id: json['id'] ?? json['_id'] ?? '',
      studentId: json['studentId'] is Map ? json['studentId']['_id'] : (json['studentId'] ?? ''),
      status: json['status'] ?? 'not_boarded',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
      address: json['location'] is Map ? json['location']['address'] : null,
      method: json['method'] ?? 'manual',
      notes: json['notes'],
    );
  }
}

class InvoiceBrief {
  final String id;
  final String invoiceNumber;
  final String monthYear;
  final double amount;
  final String status; // 'unpaid', 'paid', 'pending_verification'
  final DateTime dueDate;

  const InvoiceBrief({
    required this.id,
    required this.invoiceNumber,
    required this.monthYear,
    required this.amount,
    required this.status,
    required this.dueDate,
  });

  factory InvoiceBrief.fromJson(Map<String, dynamic> json) {
    return InvoiceBrief(
      id: json['id'] ?? json['_id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? 'INV-000',
      monthYear: json['monthYear'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 7500.0,
      status: json['status'] ?? 'unpaid',
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ActiveTripBrief {
  final String id;
  final String tripType;
  final String status;
  final bool isGpsActive;
  final int currentStopIndex;
  final int delayMinutes;
  final String? delayReason;
  final DateTime? startedAt;

  const ActiveTripBrief({
    required this.id,
    required this.tripType,
    required this.status,
    this.isGpsActive = false,
    this.currentStopIndex = 0,
    this.delayMinutes = 0,
    this.delayReason,
    this.startedAt,
  });

  factory ActiveTripBrief.fromJson(Map<String, dynamic> json) {
    return ActiveTripBrief(
      id: json['id'] ?? json['_id'] ?? '',
      tripType: json['tripType'] ?? 'morning_pickup',
      status: json['status'] ?? 'scheduled',
      isGpsActive: json['isGpsActive'] ?? false,
      currentStopIndex: json['currentStopIndex'] ?? 0,
      delayMinutes: json['delayMinutes'] ?? 0,
      delayReason: json['delayReason'],
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'].toString())
          : null,
    );
  }
}

class ParentDashboardData {
  final List<StudentModel> students;
  final ActiveTripBrief? activeTrip;
  final List<AttendanceBrief> todayAttendance;
  final InvoiceBrief? latestInvoice;

  const ParentDashboardData({
    required this.students,
    this.activeTrip,
    this.todayAttendance = const [],
    this.latestInvoice,
  });

  factory ParentDashboardData.fromJson(Map<String, dynamic> json) {
    final rawStudents = json['students'] as List? ?? [];
    final rawAttendance = json['todayAttendance'] as List? ?? [];

    return ParentDashboardData(
      students: rawStudents.map((s) => StudentModel.fromJson(s as Map<String, dynamic>)).toList(),
      activeTrip: json['activeTrip'] != null
          ? ActiveTripBrief.fromJson(json['activeTrip'] as Map<String, dynamic>)
          : null,
      todayAttendance: rawAttendance
          .map((a) => AttendanceBrief.fromJson(a as Map<String, dynamic>))
          .toList(),
      latestInvoice: json['latestInvoice'] != null
          ? InvoiceBrief.fromJson(json['latestInvoice'] as Map<String, dynamic>)
          : null,
    );
  }
}
