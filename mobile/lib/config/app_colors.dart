import 'package:flutter/material.dart';

class AppColors {
  // Brand Primary & Navy Shades
  static const Color primary = Color(0xFF0E2442); // Deep Royal Navy
  static const Color primaryLight = Color(0xFF1E3A63);
  static const Color primaryDark = Color(0xFF081426);

  // Brand Accent - Emerald / Transit Green
  static const Color accent = Color(0xFF10B981);
  static const Color accentLight = Color(0xFFD1FAE5);
  static const Color accentDark = Color(0xFF059669);

  // Sri Lanka School Bus / Van Accent Amber
  static const Color vanAmber = Color(0xFFF59E0B);
  static const Color vanAmberLight = Color(0xFFFEF3C7);

  // Neutral & Surfaces
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceElevated = Color(0xFFFFFFFF);
  static const Color cardBorder = Color(0xFFE2E8F0);

  // Typography
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textLight = Color(0xFFF8FAFC);

  // Functional Status
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF0E2442), Color(0xFF1E3A63)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF059669)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
