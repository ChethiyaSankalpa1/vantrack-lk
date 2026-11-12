import 'package:flutter/material.dart';
import '../models/student_model.dart';
import '../models/trip_model.dart';
import '../models/user_role.dart';
import '../screens/attendance/attendance_history_screen.dart';
import '../screens/attendance/qr_scanner_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/common/role_router_screen.dart';
import '../screens/driver/assistant_dashboard_screen.dart';
import '../screens/driver/driver_dashboard_screen.dart';
import '../screens/driver/trip_history_screen.dart';
import '../screens/invoices/invoices_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/parent/add_child_screen.dart';
import '../screens/parent/parent_dashboard_screen.dart';
import '../screens/parent/report_absence_screen.dart';
import '../screens/parent/student_profile_screen.dart';
import '../screens/profile/parent_profile_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/tracking/live_tracking_screen.dart';
import '../screens/trip/trip_details_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String roleRouter = '/role-router';

  // Role Dashboards
  static const String parentDashboard = '/parent/dashboard';
  static const String driverDashboard = '/driver/dashboard';
  static const String assistantDashboard = '/assistant/dashboard';

  // Feature Screens
  static const String liveTracking = '/tracking/live';
  static const String studentDetails = '/students/details';
  static const String addChild = '/students/add';
  static const String reportAbsence = '/students/absence';
  static const String routeDetails = '/routes/details';
  static const String attendance = '/attendance';
  static const String qrScanner = '/attendance/qr-scanner';
  static const String tripDetails = '/trips/details';
  static const String tripHistory = '/trips/history';
  static const String notifications = '/notifications';
  static const String invoices = '/invoices';
  static const String paymentHistory = '/payments/history';
  static const String profile = '/profile';
  static const String settings = '/settings';

  static Route<dynamic> onGenerateRoute(RouteSettings routeSettings) {
    switch (routeSettings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case register:
        final role = routeSettings.arguments is UserRole
            ? routeSettings.arguments as UserRole
            : UserRole.parent;
        return MaterialPageRoute(builder: (_) => RegisterScreen(initialRole: role));
      case forgotPassword:
        return MaterialPageRoute(builder: (_) => const ForgotPasswordScreen());
      case roleRouter:
        return MaterialPageRoute(builder: (_) => const RoleRouterScreen());
      case parentDashboard:
        return MaterialPageRoute(builder: (_) => const ParentDashboardScreen());
      case driverDashboard:
        return MaterialPageRoute(builder: (_) => const DriverDashboardScreen());
      case assistantDashboard:
        return MaterialPageRoute(builder: (_) => const AssistantDashboardScreen());
      case studentDetails:
        final student = routeSettings.arguments as StudentModel;
        return MaterialPageRoute(builder: (_) => StudentProfileScreen(student: student));
      case addChild:
        return MaterialPageRoute(builder: (_) => const AddChildScreen());
      case reportAbsence:
        final student = routeSettings.arguments is StudentModel ? routeSettings.arguments as StudentModel : null;
        return MaterialPageRoute(builder: (_) => ReportAbsenceScreen(initialStudent: student));
      case liveTracking:
        return MaterialPageRoute(builder: (_) => const LiveTrackingScreen());
      case attendance:
        final args = routeSettings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => AttendanceHistoryScreen(
            studentId: args?['studentId']?.toString(),
            studentName: args?['studentName']?.toString(),
          ),
        );
      case qrScanner:
        final args = routeSettings.arguments as Map<String, dynamic>?;
        return MaterialPageRoute(
          builder: (_) => QrScannerScreen(
            tripId: args?['tripId']?.toString() ?? '',
            initialMode: args?['initialMode']?.toString() ?? 'boarded',
          ),
        );
      case tripDetails:
        final args = routeSettings.arguments as Map<String, dynamic>;
        return MaterialPageRoute(
          builder: (_) => TripDetailsScreen(
            trip: args['trip'] as TripModel,
            isDriverView: args['isDriverView'] as bool? ?? false,
          ),
        );
      case tripHistory:
        return MaterialPageRoute(builder: (_) => const TripHistoryScreen());
      case invoices:
      case paymentHistory:
        return MaterialPageRoute(builder: (_) => const InvoicesScreen());
      case notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());
      case profile:
        return MaterialPageRoute(builder: (_) => const ParentProfileScreen());
      case settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('No route defined for ${routeSettings.name}'),
            ),
          ),
        );
    }
  }
}
