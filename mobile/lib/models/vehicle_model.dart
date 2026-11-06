class DriverBrief {
  final String? id;
  final String name;
  final String phone;
  final String? avatarUrl;
  final String? licenseNumber;

  const DriverBrief({
    this.id,
    required this.name,
    required this.phone,
    this.avatarUrl,
    this.licenseNumber,
  });

  factory DriverBrief.fromJson(Map<String, dynamic> json) {
    return DriverBrief(
      id: json['id'] ?? json['_id'],
      name: json['name'] ?? 'Driver Assigned',
      phone: json['phone'] ?? '',
      avatarUrl: json['avatarUrl'] ?? json['avatar'],
      licenseNumber: json['licenseNumber'],
    );
  }
}

class VehicleModel {
  final String id;
  final String registrationNumber;
  final String makeModel;
  final int capacity;
  final String color;
  final String status;
  final String? photoUrl;
  final DriverBrief? driver;
  final DriverBrief? assistant;

  const VehicleModel({
    required this.id,
    required this.registrationNumber,
    required this.makeModel,
    this.capacity = 16,
    this.color = 'School Yellow',
    this.status = 'active',
    this.photoUrl,
    this.driver,
    this.assistant,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'] ?? json['_id'] ?? '',
      registrationNumber: json['registrationNumber'] ?? 'WP NB-XXXX',
      makeModel: json['makeModel'] ?? 'Toyota HiAce KDH',
      capacity: json['capacity'] ?? 16,
      color: json['color'] ?? 'School Yellow',
      status: json['status'] ?? 'active',
      photoUrl: json['photoUrl'],
      driver: json['driver'] != null ? DriverBrief.fromJson(json['driver']) : null,
      assistant: json['assistant'] != null ? DriverBrief.fromJson(json['assistant']) : null,
    );
  }
}
