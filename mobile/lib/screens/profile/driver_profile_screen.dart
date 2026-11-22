import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../models/user_role.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';
import '../../services/upload_service.dart';

class DriverProfileScreen extends StatefulWidget {
  const DriverProfileScreen({super.key});

  @override
  State<DriverProfileScreen> createState() => _DriverProfileScreenState();
}

class _DriverProfileScreenState extends State<DriverProfileScreen> {
  final UploadService _uploadService = UploadService();
  final ImagePicker _imagePicker = ImagePicker();
  bool _isUploadingPhoto = false;

  Future<void> _pickAndUploadPhoto(ImageSource source) async {
    try {
      final XFile? picked = await _imagePicker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1000,
        maxHeight: 1000,
      );

      if (picked == null) return;

      setState(() => _isUploadingPhoto = true);

      final result = await _uploadService.uploadFile(
        file: File(picked.path),
        type: 'avatar',
      );

      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      final ok = await auth.updateProfile(avatarUrl: result.url);
      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('📸 Profile picture updated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.errorMessage ?? 'Failed to update profile picture.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error uploading image: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingPhoto = false);
      }
    }
  }

  Future<void> _pickFilePhoto() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
      );

      if (result == null || result.files.single.path == null) return;

      final file = File(result.files.single.path!);

      setState(() => _isUploadingPhoto = true);

      final uploadResult = await _uploadService.uploadFile(
        file: file,
        type: 'avatar',
      );

      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      final ok = await auth.updateProfile(avatarUrl: uploadResult.url);
      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('📸 Profile image uploaded successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.errorMessage ?? 'Failed to update profile picture.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error picking file: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploadingPhoto = false);
      }
    }
  }

  void _showPhotoOptionsModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.cardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Select Profile Picture',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            const Text(
              'Upload your real photo from camera, gallery, or files',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),

            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
              ),
              title: const Text('Take Photo (Camera)', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.photo_library_rounded, color: AppColors.accent),
              ),
              title: const Text('Choose from Gallery (PNG / JPG / WEBP)', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadPhoto(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.folder_open_rounded, color: AppColors.info),
              ),
              title: const Text('Choose Image File', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(ctx);
                _pickFilePhoto();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditProfileModal(AuthProvider auth) {
    final user = auth.user;
    final nameController = TextEditingController(text: user?.name ?? '');
    final phoneController = TextEditingController(text: user?.phone ?? '');
    final emergencyController = TextEditingController(text: user?.emergencyContact ?? '');
    final addressController = TextEditingController(text: user?.address ?? '');
    final nicController = TextEditingController(text: user?.nicNumber ?? '');
    final licenseController = TextEditingController(text: user?.licenseNumber ?? '');

    bool isSaving = false;
    final isDriver = user?.role == UserRole.driver;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return DraggableScrollableSheet(
            initialChildSize: 0.9,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (context, scrollController) => Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 4),
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.edit_note_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isDriver ? 'Edit Driver Profile' : 'Edit Assistant Profile',
                                style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800),
                              ),
                              const Text(
                                'Update your personal details & contact information',
                                style: TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: const Icon(Icons.close_rounded, color: Colors.white),
                        ),
                      ],
                    ),
                  ),

                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextField(
                            controller: nameController,
                            decoration: InputDecoration(
                              labelText: 'Full Name *',
                              prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Mobile Phone *',
                              prefixIcon: const Icon(Icons.phone_outlined, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: emergencyController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Emergency Contact Number',
                              prefixIcon: const Icon(Icons.contact_emergency_outlined, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),
                          const SizedBox(height: 14),

                          TextField(
                            controller: nicController,
                            decoration: InputDecoration(
                              labelText: 'NIC Number',
                              prefixIcon: const Icon(Icons.badge_outlined, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),
                          const SizedBox(height: 14),

                          if (isDriver) ...[
                            TextField(
                              controller: licenseController,
                              decoration: InputDecoration(
                                labelText: 'Driving License Number',
                                prefixIcon: const Icon(Icons.card_membership_rounded, color: AppColors.primary),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                                contentPadding: const EdgeInsets.all(14),
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          TextField(
                            controller: addressController,
                            maxLines: 2,
                            decoration: InputDecoration(
                              labelText: 'Residential Address',
                              prefixIcon: const Icon(Icons.home_outlined, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ),

                  Container(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Colors.grey.shade200)),
                    ),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.accent,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: isSaving
                            ? null
                            : () async {
                                final name = nameController.text.trim();
                                final phone = phoneController.text.trim();

                                if (name.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Name cannot be empty.'), backgroundColor: AppColors.error),
                                  );
                                  return;
                                }

                                setModalState(() => isSaving = true);

                                final ok = await auth.updateProfile(
                                  name: name,
                                  phone: phone,
                                  emergencyContact: emergencyController.text.trim(),
                                  address: addressController.text.trim(),
                                  nicNumber: nicController.text.trim(),
                                  licenseNumber: isDriver ? licenseController.text.trim() : null,
                                );

                                if (context.mounted) {
                                  setModalState(() => isSaving = false);
                                  Navigator.pop(ctx);
                                  if (ok) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('✅ Profile details updated successfully!'),
                                        backgroundColor: AppColors.success,
                                      ),
                                    );
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(auth.errorMessage ?? 'Failed to update profile.'),
                                        backgroundColor: AppColors.error,
                                      ),
                                    );
                                  }
                                }
                              },
                        child: isSaving
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Text(
                                'Save Profile Changes',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    ).whenComplete(() {
      nameController.dispose();
      phoneController.dispose();
      emergencyController.dispose();
      addressController.dispose();
      nicController.dispose();
      licenseController.dispose();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final driver = context.watch<DriverProvider>();
    final user = auth.user;
    final vehicle = driver.dashboardData?.vehicle;
    final isAssistant = user?.role == UserRole.assistant;

    final avatarUrl = user?.avatarUrl;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(isAssistant ? 'Assistant Profile' : 'Driver Profile'),
        actions: [
          IconButton(
            tooltip: 'Edit Profile Details',
            icon: const Icon(Icons.edit_rounded),
            onPressed: () => _showEditProfileModal(auth),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Driver / Assistant Profile Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                children: [
                  // Avatar with Camera Upload Badge
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      GestureDetector(
                        onTap: _showPhotoOptionsModal,
                        child: CircleAvatar(
                          radius: 46,
                          backgroundColor: (isAssistant ? AppColors.info : AppColors.vanAmber).withValues(alpha: 0.15),
                          backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                              ? NetworkImage(avatarUrl)
                              : null,
                          child: avatarUrl == null || avatarUrl.isEmpty
                              ? Text(
                                  user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : (isAssistant ? 'A' : 'D'),
                                  style: TextStyle(
                                    fontSize: 36,
                                    fontWeight: FontWeight.bold,
                                    color: isAssistant ? AppColors.info : AppColors.vanAmber,
                                  ),
                                )
                              : null,
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: _showPhotoOptionsModal,
                          child: Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                          ),
                        ),
                      ),
                      if (_isUploadingPhoto)
                        Positioned.fill(
                          child: Container(
                            decoration: const BoxDecoration(
                              color: Colors.black45,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: CircularProgressIndicator(color: Colors.white),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? (isAssistant ? 'Assistant Name' : 'Driver Name'),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: (isAssistant ? AppColors.info : AppColors.vanAmber).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isAssistant ? 'School Van Assistant (Attendant)' : 'School Van Driver (Captain)',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isAssistant ? AppColors.info : AppColors.vanAmber,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Edit Profile Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        side: const BorderSide(color: AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.edit_outlined, size: 16, color: AppColors.primary),
                      label: const Text('Edit Profile & Change Photo', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.primary)),
                      onPressed: () => _showEditProfileModal(auth),
                    ),
                  ),

                  const SizedBox(height: 14),
                  const Divider(),
                  const SizedBox(height: 12),
                  _buildProfileRow(Icons.phone_outlined, 'Phone Number', user?.phone ?? 'N/A'),
                  if (!isAssistant) ...[
                    const SizedBox(height: 10),
                    _buildProfileRow(Icons.badge_outlined, 'Driving License', user?.licenseNumber ?? 'Not provided'),
                  ],
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.credit_card_outlined, 'NIC Number', user?.nicNumber ?? 'Not provided'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.contact_emergency_outlined, 'Emergency Contact', user?.emergencyContact ?? 'Not provided'),
                  const SizedBox(height: 10),
                  _buildProfileRow(Icons.home_outlined, 'Residential Address', user?.address ?? 'Not provided'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Assigned Vehicle Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Assigned Vehicle Details', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  if (vehicle == null)
                    const Text('No vehicle currently assigned.', style: TextStyle(color: AppColors.textSecondary))
                  else ...[
                    _buildProfileRow(Icons.directions_bus_rounded, 'Registration Number', vehicle['registrationNumber'] ?? 'WP NB-7842'),
                    const SizedBox(height: 10),
                    _buildProfileRow(Icons.commute_rounded, 'Make & Model', vehicle['makeModel'] ?? 'Toyota HiAce KDH'),
                    const SizedBox(height: 10),
                    _buildProfileRow(Icons.event_seat_rounded, 'Seating Capacity', '${vehicle['seatingCapacity'] ?? 16} Students'),
                    if (vehicle['driverId'] != null && isAssistant) ...[
                      const SizedBox(height: 10),
                      _buildProfileRow(
                        Icons.person_pin_circle_rounded,
                        'Van Captain / Driver',
                        '${vehicle['driverId'] is Map ? (vehicle['driverId']['name'] ?? 'Assigned') : 'Assigned'}${vehicle['driverId'] is Map && vehicle['driverId']['phone'] != null ? ' (${vehicle['driverId']['phone']})' : ''}',
                      ),
                    ],
                    if (vehicle['assistantId'] != null && !isAssistant) ...[
                      const SizedBox(height: 10),
                      _buildProfileRow(
                        Icons.person_pin_circle_rounded,
                        'Van Assistant',
                        '${vehicle['assistantId'] is Map ? (vehicle['assistantId']['name'] ?? 'Assigned') : 'Assigned'}${vehicle['assistantId'] is Map && vehicle['assistantId']['phone'] != null ? ' (${vehicle['assistantId']['phone']})' : ''}',
                      ),
                    ],
                  ],
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.logout_rounded),
                label: Text(
                  isAssistant ? 'Log Out of Assistant Portal' : 'Log Out of Driver Portal',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                onPressed: () async {
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (r) => false);
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.textMuted),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
            Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          ],
        ),
      ],
    );
  }
}
