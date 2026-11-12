class TripModel {
  final String id;
  final String tripType; // 'morning_pickup' | 'afternoon_drop'
  final String status; // 'scheduled' | 'started' | 'completed' | 'cancelled'
  final bool isGpsActive;
  final int currentStopIndex;
  final int delayMinutes;
  final String? delayReason;
  final int studentCount;
  final DateTime? date;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final Map<String, dynamic>? route;
  final Map<String, dynamic>? vehicle;

  const TripModel({
    required this.id,
    required this.tripType,
    this.status = 'scheduled',
    this.isGpsActive = false,
    this.currentStopIndex = 0,
    this.delayMinutes = 0,
    this.delayReason,
    this.studentCount = 0,
    this.date,
    this.startedAt,
    this.endedAt,
    this.route,
    this.vehicle,
  });

  DateTime? get startTime => startedAt;
  DateTime? get endTime => endedAt;

  factory TripModel.fromJson(Map<String, dynamic> json) {
    return TripModel(
      id: json['id'] ?? json['_id'] ?? '',
      tripType: json['tripType'] ?? 'morning_pickup',
      status: json['status'] ?? 'scheduled',
      isGpsActive: json['isGpsActive'] ?? false,
      currentStopIndex: json['currentStopIndex'] ?? 0,
      delayMinutes: json['delayMinutes'] ?? 0,
      delayReason: json['delayReason'],
      studentCount: json['studentCount'] ??
          (json['students'] is List ? (json['students'] as List).length : 0),
      date: json['date'] != null ? DateTime.tryParse(json['date'].toString()) : null,
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'].toString())
          : null,
      endedAt: json['endedAt'] != null ? DateTime.tryParse(json['endedAt'].toString()) : null,
      route: json['routeId'] is Map ? json['routeId'] as Map<String, dynamic> : null,
      vehicle: json['vehicleId'] is Map ? json['vehicleId'] as Map<String, dynamic> : null,
    );
  }

  String get displayTripType {
    switch (tripType) {
      case 'morning_pickup':
        return 'Morning School Pickup';
      case 'afternoon_drop':
        return 'Afternoon Home Drop-off';
      default:
        return tripType;
    }
  }

  bool get isActive => status == 'started' || status == 'active';
  bool get isScheduled => status == 'scheduled' || status == 'assigned' || status == 'ready';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isInterrupted => status == 'interrupted';
}
