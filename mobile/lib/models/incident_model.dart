class IncidentModel {
  final String id;
  final String tripId;
  final String vehicleId;
  final String reporterName;
  final String reporterRole;
  final String type; // 'traffic_delay', 'breakdown', 'route_change', 'other'
  final String title;
  final String description;
  final int estimatedDelayMinutes;
  final String? photoUrl;
  final DateTime createdAt;

  const IncidentModel({
    required this.id,
    required this.tripId,
    required this.vehicleId,
    required this.reporterName,
    required this.reporterRole,
    required this.type,
    required this.title,
    required this.description,
    required this.estimatedDelayMinutes,
    this.photoUrl,
    required this.createdAt,
  });

  factory IncidentModel.fromJson(Map<String, dynamic> json) {
    final reporter = json['reportedBy'] is Map ? json['reportedBy'] as Map<String, dynamic> : null;
    return IncidentModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      tripId: json['tripId'] is Map ? json['tripId']['_id']?.toString() ?? '' : json['tripId']?.toString() ?? '',
      vehicleId: json['vehicleId'] is Map ? json['vehicleId']['_id']?.toString() ?? '' : json['vehicleId']?.toString() ?? '',
      reporterName: reporter?['name'] ?? 'Driver',
      reporterRole: reporter?['role'] ?? 'driver',
      type: json['type'] ?? 'other',
      title: json['title'] ?? 'Incident',
      description: json['description'] ?? '',
      estimatedDelayMinutes: (json['estimatedDelayMinutes'] as num?)?.toInt() ?? 15,
      photoUrl: json['photoUrl'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
