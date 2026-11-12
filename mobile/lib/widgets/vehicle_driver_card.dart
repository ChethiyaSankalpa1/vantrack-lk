import 'package:flutter/material.dart';
import '../config/app_colors.dart';
import '../models/vehicle_model.dart';

class VehicleDriverCard extends StatelessWidget {
  final VehicleModel? vehicle;
  final VoidCallback onCallDriver;

  const VehicleDriverCard({
    super.key,
    required this.vehicle,
    required this.onCallDriver,
  });

  @override
  Widget build(BuildContext context) {
    if (vehicle == null) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.vanAmber.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.directions_bus_outlined,
                color: AppColors.vanAmber,
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'No Van Assigned Yet',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'The fleet administrator will assign a school van shortly.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    final driver = vehicle!.driver;
    final assistant = vehicle!.assistant;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Vehicle header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  vehicle!.registrationNumber,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  vehicle!.makeModel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.accentLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${vehicle!.capacity} Seats',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.accentDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 14),

          // Driver details row
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage: driver?.avatarUrl != null &&
                        driver!.avatarUrl!.isNotEmpty
                    ? NetworkImage(driver.avatarUrl!)
                    : null,
                child: driver?.avatarUrl == null || driver!.avatarUrl!.isEmpty
                    ? const Icon(Icons.person, color: AppColors.primary, size: 24)
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      driver?.name ?? 'Assigned Van Driver',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      driver?.phone ?? 'Mobile unavailable',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (assistant != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Assistant: ${assistant.name} (${assistant.phone})',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Action button to call driver
              IconButton(
                onPressed: onCallDriver,
                icon: const Icon(Icons.phone_rounded, color: Colors.white, size: 18),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  padding: const EdgeInsets.all(10),
                ),
                tooltip: 'Call Driver',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
