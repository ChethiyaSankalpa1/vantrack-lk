import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/notification_service.dart';

enum NotificationFilter { all, trips, attendance, invoices, incidents }

class NotificationProvider extends ChangeNotifier {
  final NotificationService _service = NotificationService();

  List<NotificationModel> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _errorMessage;
  NotificationFilter _selectedFilter = NotificationFilter.all;

  List<NotificationModel> get notifications => _filteredNotifications;
  List<NotificationModel> get allNotifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  NotificationFilter get selectedFilter => _selectedFilter;

  List<NotificationModel> get _filteredNotifications {
    switch (_selectedFilter) {
      case NotificationFilter.trips:
        return _notifications.where((n) => n.type == 'trip_start' || n.type == 'general').toList();
      case NotificationFilter.attendance:
        return _notifications.where((n) => n.type == 'student_boarded' || n.type == 'student_dropped').toList();
      case NotificationFilter.invoices:
        return _notifications.where((n) => n.type == 'payment_due' || n.type == 'payment_receipt').toList();
      case NotificationFilter.incidents:
        return _notifications.where((n) => n.type == 'delay' || n.type == 'breakdown').toList();
      case NotificationFilter.all:
        return _notifications;
    }
  }

  void setFilter(NotificationFilter filter) {
    _selectedFilter = filter;
    notifyListeners();
  }

  Future<void> loadNotifications() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await _service.getNotifications();
      _notifications = result['notifications'] as List<NotificationModel>;
      _unreadCount = result['unreadCount'] as int;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _service.markAllAsRead();
      _notifications = _notifications.map((n) => n.copyWith(isRead: true)).toList();
      _unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markAsRead(String id) async {
    try {
      await _service.markAsRead(id);
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1 && !_notifications[index].isRead) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        if (_unreadCount > 0) _unreadCount--;
        notifyListeners();
      }
    } catch (_) {}
  }

  /// Handle incoming real-time socket notification
  void handleIncomingNotification(Map<String, dynamic> json) {
    final notif = NotificationModel.fromJson(json);
    _notifications.insert(0, notif);
    _unreadCount++;
    notifyListeners();
  }
}
