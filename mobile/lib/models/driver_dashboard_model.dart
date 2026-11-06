import 'trip_model.dart';
import 'student_model.dart';

class DriverDashboardData {
  final Map<String, dynamic> driver;
  final Map<String, dynamic>? vehicle;
  final Map<String, dynamic>? route;
  final List<TripModel> todayTrips;
  final TripModel? activeTrip;
  final List<StudentModel> assignedStudents;
  final List<Map<String, dynamic>> tripAttendance;

  const DriverDashboardData({
    required this.driver,
    this.vehicle,
    this.route,
    this.todayTrips = const [],
    this.activeTrip,
    this.assignedStudents = const [],
    this.tripAttendance = const [],
  });

  factory DriverDashboardData.fromJson(Map<String, dynamic> json) {
    final rawTrips = json['todayTrips'] as List? ?? [];
    final rawStudents = json['assignedStudents'] as List? ?? [];
    final rawAttendance = json['tripAttendance'] as List? ?? [];

    return DriverDashboardData(
      driver: json['driver'] as Map<String, dynamic>? ?? {},
      vehicle: json['vehicle'] as Map<String, dynamic>?,
      route: json['route'] as Map<String, dynamic>?,
      todayTrips: rawTrips.map((t) => TripModel.fromJson(t as Map<String, dynamic>)).toList(),
      activeTrip: json['activeTrip'] != null
          ? TripModel.fromJson(json['activeTrip'] as Map<String, dynamic>)
          : null,
      assignedStudents: rawStudents
          .map((s) => StudentModel.fromJson(s as Map<String, dynamic>))
          .toList(),
      tripAttendance: rawAttendance
          .map((a) => a as Map<String, dynamic>)
          .toList(),
    );
  }
}
