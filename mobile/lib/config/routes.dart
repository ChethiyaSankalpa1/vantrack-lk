import 'package:flutter/material.dart';
import '../models/student_model.dart';
import '../models/user_role.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/common/role_router_screen.dart';
import '../screens/driver/assistant_dashboard_screen.dart';
import '../screens/driver/driver_dashboard_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/parent/add_child_screen.dart';
import '../screens/parent/parent_dashboard_screen.dart';
import '../screens/parent/student_profile_screen.dart';
import '../screens/splash/splash_screen.dart';

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
  static const String routeDetails = '/routes/details';
  static const String attendance = '/attendance';
  static const String tripDetails = '/trips/details';
  static const String notifications = '/notifications';
  static const String invoices = '/invoices';
  static const String paymentHistory = '/payments/history';
  static const String profile = '/profile';
  static const String settings = '/settings';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(builder: (_) => const SplashScreen());
      case onboarding:
        return MaterialPageRoute(builder: (_) => const OnboardingScreen());
      case login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case register:
        final role = settings.arguments is UserRole
            ? settings.arguments as UserRole
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
        final student = settings.arguments as StudentModel;
        return MaterialPageRoute(builder: (_) => StudentProfileScreen(student: student));
      case addChild:
        return MaterialPageRoute(builder: (_) => const AddChildScreen());
      case liveTracking:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Live GPS Tracking')),
            body: const Center(
              child: Text(
                'Live GPS Tracking Map\n(Coming in Stage 6)',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        );
      case attendance:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Student Attendance History')),
            body: const Center(
              child: Text(
                'Student Attendance History & QR Logs\n(Coming in Stage 5)',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        );
      case invoices:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            appBar: AppBar(title: const Text('Monthly Invoices & Receipts')),
            body: const Center(
              child: Text(
                'Monthly Invoices & PayHere Integration\n(Coming in Stage 8)',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(
              child: Text('No route defined for ${settings.name}'),
            ),
          ),
        );
    }
  }
}
