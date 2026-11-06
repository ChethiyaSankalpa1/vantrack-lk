import 'package:flutter/material.dart';
import '../core/errors/api_exception.dart';
import '../models/parent_dashboard_model.dart';
import '../models/student_model.dart';
import '../services/parent_service.dart';
import '../services/student_service.dart';

class ParentDashboardProvider extends ChangeNotifier {
  final ParentService _parentService = ParentService();
  final StudentService _studentService = StudentService();

  ParentDashboardData? _dashboardData;
  int _selectedStudentIndex = 0;
  bool _isLoading = false;
  String? _errorMessage;

  ParentDashboardData? get dashboardData => _dashboardData;
  int get selectedStudentIndex => _selectedStudentIndex;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<StudentModel> get students => _dashboardData?.students ?? [];

  StudentModel? get selectedStudent {
    if (students.isEmpty) return null;
    if (_selectedStudentIndex >= students.length) return students.first;
    return students[_selectedStudentIndex];
  }

  AttendanceBrief? get selectedStudentAttendance {
    final student = selectedStudent;
    if (student == null || _dashboardData == null) return null;
    try {
      return _dashboardData!.todayAttendance.firstWhere(
        (a) => a.studentId == student.id,
      );
    } catch (_) {
      return null;
    }
  }

  void selectStudent(int index) {
    if (index >= 0 && index < students.length) {
      _selectedStudentIndex = index;
      notifyListeners();
    }
  }

  Future<void> loadDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _dashboardData = await _parentService.getDashboardData();
      if (_selectedStudentIndex >= students.length) {
        _selectedStudentIndex = 0;
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> reportStudentAbsence(String reason) async {
    final student = selectedStudent;
    if (student == null) return false;

    try {
      await _studentService.reportAbsence(student.id, reason);
      await loadDashboard(); // refresh state
      return true;
    } catch (e) {
      return false;
    }
  }
}
