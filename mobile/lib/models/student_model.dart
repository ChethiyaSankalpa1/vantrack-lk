import 'vehicle_model.dart';

class LocationSchedule {
  final String address;
  final double latitude;
  final double longitude;
  final String scheduledTime;

  const LocationSchedule({
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.scheduledTime,
  });

  factory LocationSchedule.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const LocationSchedule(
        address: 'Designated Stop',
        latitude: 6.8485,
        longitude: 79.9267,
        scheduledTime: '06:45 AM',
      );
    }
    return LocationSchedule(
      address: json['address'] ?? 'Designated Stop',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 6.8485,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 79.9267,
      scheduledTime: json['scheduledTime'] ?? '06:45 AM',
    );
  }
}

class StudentModel {
  final String id;
  final String name;
  final String? admissionNumber;
  final String schoolName;
  final String grade;
  final String parentId;
  final String? photoUrl;
  final String? qrCodeString;
  final double monthlyFee;
  final String status;
  final LocationSchedule pickupLocation;
  final LocationSchedule dropoffLocation;
  final VehicleModel? assignedVehicle;
  final Map<String, dynamic>? assignedRoute;

  String get pickupTime => pickupLocation.scheduledTime;
  String get dropoffTime => dropoffLocation.scheduledTime;

  const StudentModel({
    required this.id,
    required this.name,
    this.admissionNumber,
    required this.schoolName,
    required this.grade,
    required this.parentId,
    this.photoUrl,
    this.qrCodeString,
    this.monthlyFee = 7500,
    this.status = 'active',
    required this.pickupLocation,
    required this.dropoffLocation,
    this.assignedVehicle,
    this.assignedRoute,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      admissionNumber: json['admissionNumber'],
      schoolName: json['schoolName'] ?? 'School',
      grade: json['grade'] ?? '',
      parentId: json['parentId'] is Map ? json['parentId']['_id'] : (json['parentId'] ?? ''),
      photoUrl: json['photoUrl'],
      qrCodeString: json['qrCodeString'],
      monthlyFee: (json['monthlyFee'] as num?)?.toDouble() ?? 7500.0,
      status: json['status'] ?? 'active',
      pickupLocation: LocationSchedule.fromJson(json['pickupLocation']),
      dropoffLocation: LocationSchedule.fromJson(json['dropoffLocation']),
      assignedVehicle: json['assignedVehicleId'] is Map
          ? VehicleModel.fromJson(json['assignedVehicleId'])
          : null,
      assignedRoute: json['assignedRouteId'] is Map ? json['assignedRouteId'] : null,
    );
  }
}
