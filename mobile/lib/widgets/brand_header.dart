import 'package:flutter/material.dart';
import '../config/app_colors.dart';
import '../config/app_constants.dart';

class BrandHeader extends StatelessWidget {
  final double iconSize;
  final bool showTagline;
  final bool isLight;

  const BrandHeader({
    super.key,
    this.iconSize = 64,
    this.showTagline = true,
    this.isLight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0E2442), Color(0xFF1E3A63)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(iconSize * 0.28),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Icon(
                Icons.directions_bus_rounded,
                size: iconSize * 0.55,
                color: Colors.white,
              ),
              Positioned(
                top: iconSize * 0.18,
                right: iconSize * 0.18,
                child: Container(
                  width: iconSize * 0.22,
                  height: iconSize * 0.22,
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.navigation_rounded,
                      size: 8,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'VanTrack',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: isLight ? Colors.white : AppColors.primary,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.accent,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'LK',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
        if (showTagline) ...[
          const SizedBox(height: 4),
          Text(
            AppConstants.appTagline,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: isLight
                  ? Colors.white.withValues(alpha: 0.8)
                  : AppColors.textSecondary,
            ),
          ),
        ],
      ],
    );
  }
}
