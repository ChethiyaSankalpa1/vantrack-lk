import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../core/utils/validators.dart';
import '../../models/user_role.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/brand_header.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/role_selector_chip.dart';

class RegisterScreen extends StatefulWidget {
  final UserRole initialRole;

  const RegisterScreen({
    super.key,
    this.initialRole = UserRole.parent,
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  late UserRole _selectedRole;

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  // Role specific controllers
  final _addressController = TextEditingController();
  final _emergencyContactController = TextEditingController();
  final _nicController = TextEditingController();
  final _licenseController = TextEditingController();

  bool _agreedToTerms = true;

  @override
  void initState() {
    super.initState();
    _selectedRole = widget.initialRole;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _addressController.dispose();
    _emergencyContactController.dispose();
    _nicController.dispose();
    _licenseController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_agreedToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the VanTrack LK terms and conditions.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.register(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      password: _passwordController.text,
      role: _selectedRole,
      address: _addressController.text.trim(),
      emergencyContact: _emergencyContactController.text.trim(),
      nicNumber: _nicController.text.trim(),
      licenseNumber: _licenseController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoutes.roleRouter,
        (route) => false,
      );
    } else {
      final error = authProvider.errorMessage ?? 'Registration failed. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(child: Text(error)),
            ],
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isLoading = authProvider.status == AuthStatus.loading;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: BrandHeader(iconSize: 48, showTagline: false),
                ),
                const SizedBox(height: 20),

                // Role selector
                const Text(
                  'I am registering as:',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                RoleSelectorChip(
                  selectedRole: _selectedRole,
                  onRoleChanged: (role) => setState(() => _selectedRole = role),
                ),
                const SizedBox(height: 20),

                // Common fields
                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name',
                  hint: 'e.g. Kasun Perera',
                  prefixIcon: Icons.person_outline_rounded,
                  validator: (v) => Validators.required(v, 'Please enter your full name'),
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hint: 'e.g. kasun@example.lk',
                  prefixIcon: Icons.mail_outline_rounded,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.email,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _phoneController,
                  label: 'Mobile Number (Sri Lanka)',
                  hint: 'e.g. 0771234567 or +94771234567',
                  prefixIcon: Icons.phone_android_rounded,
                  keyboardType: TextInputType.phone,
                  validator: Validators.phone,
                ),
                const SizedBox(height: 14),

                // Role-specific fields
                if (_selectedRole == UserRole.parent) ...[
                  CustomTextField(
                    controller: _addressController,
                    label: 'Home / Pickup Address',
                    hint: 'e.g. 42/B Temple Road, Maharagama',
                    prefixIcon: Icons.home_outlined,
                  ),
                  const SizedBox(height: 14),
                  CustomTextField(
                    controller: _emergencyContactController,
                    label: 'Emergency Contact Number',
                    hint: 'e.g. 0719876543',
                    prefixIcon: Icons.contact_phone_outlined,
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 14),
                ],

                if (_selectedRole == UserRole.driver || _selectedRole == UserRole.assistant) ...[
                  CustomTextField(
                    controller: _nicController,
                    label: 'National Identity Card (NIC)',
                    hint: 'e.g. 198512345678 or 851234567V',
                    prefixIcon: Icons.badge_outlined,
                    validator: (v) => Validators.required(v, 'NIC number is required'),
                  ),
                  const SizedBox(height: 14),
                ],

                if (_selectedRole == UserRole.driver) ...[
                  CustomTextField(
                    controller: _licenseController,
                    label: 'Driving License Number',
                    hint: 'e.g. B1234567',
                    prefixIcon: Icons.credit_card_rounded,
                    validator: (v) => Validators.required(v, 'Driving license is required'),
                  ),
                  const SizedBox(height: 14),
                ],

                // Password fields
                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: 'At least 6 characters',
                  prefixIcon: Icons.lock_outline_rounded,
                  isPassword: true,
                  validator: Validators.password,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  hint: 'Re-enter your password',
                  prefixIcon: Icons.lock_outline_rounded,
                  isPassword: true,
                  validator: (v) => Validators.confirmPassword(v, _passwordController.text),
                ),
                const SizedBox(height: 16),

                // Terms agreement
                Row(
                  children: [
                    Checkbox(
                      value: _agreedToTerms,
                      activeColor: AppColors.primary,
                      onChanged: (val) => setState(() => _agreedToTerms = val ?? true),
                    ),
                    const Expanded(
                      child: Text(
                        'I accept the School Transportation Terms & Safety Policies',
                        style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Register button
                CustomButton(
                  text: 'Register as ${_selectedRole.shortName}',
                  isLoading: isLoading,
                  onPressed: _handleRegister,
                ),
                const SizedBox(height: 24),

                // Login link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Already registered? ',
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: const Text(
                        'Log In',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
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
