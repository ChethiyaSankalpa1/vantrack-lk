import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../core/utils/validators.dart';
import '../../providers/parent_dashboard_provider.dart';
import '../../services/student_service.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class AddChildScreen extends StatefulWidget {
  const AddChildScreen({super.key});

  @override
  State<AddChildScreen> createState() => _AddChildScreenState();
}

class _AddChildScreenState extends State<AddChildScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _admissionController = TextEditingController();
  final _schoolController = TextEditingController();
  final _gradeController = TextEditingController();
  final _pickupAddressController = TextEditingController();
  final _pickupTimeController = TextEditingController(text: '06:40 AM');
  final _photoUrlController = TextEditingController();

  final _studentService = StudentService();
  final _imagePicker = ImagePicker();

  bool _isLoading = false;
  bool _isUploadingPhoto = false;
  File? _localSelectedImage;

  final List<String> _popularSchools = [
    'Royal College, Colombo 07',
    'Ananda College, Colombo 10',
    'Visakha Vidyalaya, Colombo 05',
    'Nalanda College, Colombo 10',
    'Musaeus College, Colombo 07',
    'Devi Balika Vidyalaya, Colombo 08',
    'Sirimavo Bandaranaike Vidyalaya, Colombo 07',
    'St. Thomas\' College, Mount Lavinia',
    'Trinity College, Kandy',
    'Mahamaya Girls\' College, Kandy',
  ];

  final List<Map<String, String>> _sampleStudentAvatars = [
    {
      'label': 'School Boy 1',
      'url': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
    },
    {
      'label': 'School Girl 1',
      'url': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    },
    {
      'label': 'School Boy 2',
      'url': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
    },
    {
      'label': 'School Girl 2',
      'url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _admissionController.dispose();
    _schoolController.dispose();
    _gradeController.dispose();
    _pickupAddressController.dispose();
    _pickupTimeController.dispose();
    _photoUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadPhoto(ImageSource source) async {
    try {
      final XFile? pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() {
        _localSelectedImage = File(pickedFile.path);
        _isUploadingPhoto = true;
      });

      // Upload to Cloudinary via backend
      final uploadedUrl = await _studentService.uploadStudentPhoto(pickedFile.path);

      if (mounted) {
        setState(() {
          _photoUrlController.text = uploadedUrl;
          _isUploadingPhoto = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('📸 Student photo uploaded successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUploadingPhoto = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to upload photo: $e'),
            backgroundColor: AppColors.error,
          ),
        );
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
        padding: const EdgeInsets.all(20),
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
              'Select Student Photo',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Choose how you want to add your child\'s profile photo:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),

            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
              ),
              title: const Text('Take Photo with Camera', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              subtitle: const Text('Capture child photo directly', style: TextStyle(fontSize: 11)),
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
              title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              subtitle: const Text('Upload existing photo from device', style: TextStyle(fontSize: 11)),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadPhoto(ImageSource.gallery);
              },
            ),

            const Divider(height: 20),
            const Text('Sample Presets:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            SizedBox(
              height: 70,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _sampleStudentAvatars.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, i) {
                  final preset = _sampleStudentAvatars[i];
                  return InkWell(
                    onTap: () {
                      Navigator.pop(ctx);
                      setState(() {
                        _localSelectedImage = null;
                        _photoUrlController.text = preset['url']!;
                      });
                    },
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundImage: NetworkImage(preset['url']!),
                        ),
                        const SizedBox(height: 4),
                        Text(preset['label']!, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await _studentService.createStudent(
        name: _nameController.text.trim(),
        admissionNumber: _admissionController.text.trim(),
        schoolName: _schoolController.text.trim(),
        grade: _gradeController.text.trim(),
        pickupAddress: _pickupAddressController.text.trim(),
        pickupTime: _pickupTimeController.text.trim(),
        photoUrl: _photoUrlController.text.trim().isNotEmpty
            ? _photoUrlController.text.trim()
            : null,
      );

      if (!mounted) return;

      // Refresh dashboard
      await context.read<ParentDashboardProvider>().loadDashboard();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Child profile registered successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error registering child: $e'),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final photoUrl = _photoUrlController.text.trim();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Register Child Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info banner
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.15),
                    ),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.school_outlined, color: AppColors.primary),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Register your child to connect them to assigned school vans, pickup stops, and digital QR attendance passes.',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Interactive Student Profile Photo Picker Avatar
                Center(
                  child: GestureDetector(
                    onTap: _showPhotoOptionsModal,
                    child: Stack(
                      children: [
                        Container(
                          width: 104,
                          height: 104,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.primary, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            backgroundImage: _localSelectedImage != null
                                ? FileImage(_localSelectedImage!) as ImageProvider
                                : (photoUrl.isNotEmpty ? NetworkImage(photoUrl) : null),
                            child: (_localSelectedImage == null && photoUrl.isEmpty)
                                ? const Icon(
                                    Icons.person_rounded,
                                    size: 54,
                                    color: AppColors.primary,
                                  )
                                : null,
                          ),
                        ),
                        if (_isUploadingPhoto)
                          Positioned.fill(
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.4),
                                shape: BoxShape.circle,
                              ),
                              child: const Center(
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 3,
                                ),
                              ),
                            ),
                          ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: AppColors.accent,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: TextButton.icon(
                    onPressed: _showPhotoOptionsModal,
                    icon: const Icon(Icons.add_a_photo_outlined, size: 16, color: AppColors.primary),
                    label: Text(
                      _localSelectedImage != null || photoUrl.isNotEmpty
                          ? 'Change Student Photo'
                          : 'Upload Student Photo 📸',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Name & Admission
                CustomTextField(
                  controller: _nameController,
                  label: 'Child Full Name',
                  hint: 'e.g. Shehan Jayawardena',
                  prefixIcon: Icons.person_outline_rounded,
                  validator: (v) =>
                      Validators.required(v, 'Please enter child name'),
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _admissionController,
                  label: 'School Admission Number (Optional)',
                  hint: 'e.g. RC-2022-8492',
                  prefixIcon: Icons.badge_outlined,
                ),
                const SizedBox(height: 14),

                // School Selection with Autocomplete
                const Text(
                  'School Name',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Autocomplete<String>(
                  initialValue: TextEditingValue(text: _schoolController.text),
                  optionsBuilder: (TextEditingValue textEditingValue) {
                    if (textEditingValue.text.isEmpty) {
                      return _popularSchools;
                    }
                    return _popularSchools.where((String option) {
                      return option
                          .toLowerCase()
                          .contains(textEditingValue.text.toLowerCase());
                    });
                  },
                  onSelected: (String selection) {
                    _schoolController.text = selection;
                  },
                  fieldViewBuilder: (
                    context,
                    controller,
                    focusNode,
                    onFieldSubmitted,
                  ) {
                    controller.addListener(() {
                      _schoolController.text = controller.text;
                    });
                    return TextFormField(
                      controller: controller,
                      focusNode: focusNode,
                      decoration: const InputDecoration(
                        hintText: 'Select or type school name',
                        prefixIcon: Icon(
                          Icons.account_balance_outlined,
                          color: AppColors.textSecondary,
                          size: 20,
                        ),
                      ),
                      validator: (v) =>
                          Validators.required(v, 'Please enter school name'),
                    );
                  },
                ),
                const SizedBox(height: 14),

                // Grade / Class
                CustomTextField(
                  controller: _gradeController,
                  label: 'Grade / Class',
                  hint: 'e.g. Grade 8-B',
                  prefixIcon: Icons.class_outlined,
                  validator: (v) =>
                      Validators.required(v, 'Please enter grade/class'),
                ),
                const SizedBox(height: 14),

                // Pickup Stop
                CustomTextField(
                  controller: _pickupAddressController,
                  label: 'Home / Morning Pickup Stop',
                  hint: 'e.g. Nugegoda Supermarket / Flyover Stop',
                  prefixIcon: Icons.location_on_outlined,
                  validator: (v) =>
                      Validators.required(v, 'Please enter pickup stop'),
                ),
                const SizedBox(height: 14),

                // Pickup Time
                CustomTextField(
                  controller: _pickupTimeController,
                  label: 'Preferred Pickup Time',
                  hint: 'e.g. 06:40 AM',
                  prefixIcon: Icons.access_time_rounded,
                ),
                const SizedBox(height: 14),

                // Photo URL / Upload
                CustomTextField(
                  controller: _photoUrlController,
                  label: 'Student Photo URL',
                  hint: 'Photo URL generated or paste custom image link',
                  prefixIcon: Icons.camera_alt_outlined,
                ),
                const SizedBox(height: 24),

                // Submit button
                CustomButton(
                  text: 'Register Child',
                  isLoading: _isLoading,
                  icon: Icons.check_circle_outline_rounded,
                  onPressed: _handleSubmit,
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
