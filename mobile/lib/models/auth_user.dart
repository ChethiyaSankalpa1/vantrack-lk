import 'user_role.dart';

class AuthUser {
  final String id;
  final String name;
  final String email;
  final String phone;
  final UserRole role;
  final String? avatarUrl;
  final String? address;
  final String? emergencyContact;
  final String? nicNumber;
  final String? licenseNumber;
  final String? assignedVehicleId;
  final bool isActive;
  final DateTime? createdAt;

  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.avatarUrl,
    this.address,
    this.emergencyContact,
    this.nicNumber,
    this.licenseNumber,
    this.assignedVehicleId,
    this.isActive = true,
    this.createdAt,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: UserRole.fromString(json['role']),
      avatarUrl: json['avatarUrl'] ?? json['avatar'],
      address: json['address'],
      emergencyContact: json['emergencyContact'],
      nicNumber: json['nicNumber'],
      licenseNumber: json['licenseNumber'],
      assignedVehicleId: json['assignedVehicleId'],
      isActive: json['isActive'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role.apiValue,
      'avatarUrl': avatarUrl,
      'address': address,
      'emergencyContact': emergencyContact,
      'nicNumber': nicNumber,
      'licenseNumber': licenseNumber,
      'assignedVehicleId': assignedVehicleId,
      'isActive': isActive,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  AuthUser copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    UserRole? role,
    String? avatarUrl,
    String? address,
    String? emergencyContact,
    String? nicNumber,
    String? licenseNumber,
    String? assignedVehicleId,
    bool? isActive,
    DateTime? createdAt,
  }) {
    return AuthUser(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      address: address ?? this.address,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      nicNumber: nicNumber ?? this.nicNumber,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      assignedVehicleId: assignedVehicleId ?? this.assignedVehicleId,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
