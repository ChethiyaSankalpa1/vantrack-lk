import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../../../config/app_colors.dart';

class GpsStatusBanner extends StatefulWidget {
  final Position? lastPosition;
  final int updateCount;

  const GpsStatusBanner({
    super.key,
    required this.lastPosition,
    required this.updateCount,
  });

  @override
  State<GpsStatusBanner> createState() => _GpsStatusBannerState();
}

class _GpsStatusBannerState extends State<GpsStatusBanner>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasPosition = widget.lastPosition != null;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: hasPosition
          ? AppColors.accent.withValues(alpha: 0.92)
          : AppColors.warning.withValues(alpha: 0.92),
      child: Row(
        children: [
          // Pulsing GPS dot
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) => Opacity(
              opacity: _pulseAnimation.value,
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withValues(alpha: 0.6),
                      blurRadius: 6,
                      spreadRadius: 2,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Status info
          Expanded(
            child: hasPosition
                ? _buildActiveInfo()
                : const Text(
                    '📡 Acquiring GPS signal...',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),

          // Update counter
          if (hasPosition)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '↑ ${widget.updateCount}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActiveInfo() {
    final pos = widget.lastPosition!;
    final lat = pos.latitude.toStringAsFixed(5);
    final lng = pos.longitude.toStringAsFixed(5);
    final speed = (pos.speed * 3.6).toStringAsFixed(1); // m/s → km/h
    final accuracy = pos.accuracy.toStringAsFixed(0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.gps_fixed_rounded, color: Colors.white, size: 12),
            const SizedBox(width: 4),
            Text(
              'LIVE  $lat, $lng',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.3,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          '$speed km/h  •  ±${accuracy}m accuracy  •  Broadcasting to parents',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.85),
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}
