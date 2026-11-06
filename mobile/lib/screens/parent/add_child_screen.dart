import 'package:flutter/material.dart';
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
  bool _isLoading = false;

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
                  label: 'Student Photo URL (Optional)',
                  hint: 'https://... or upload photo',
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
