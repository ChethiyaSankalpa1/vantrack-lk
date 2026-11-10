import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../config/routes.dart';
import '../../core/storage/local_storage.dart';
import '../../core/utils/validators.dart';
import '../../models/user_role.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/brand_header.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/role_selector_chip.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  UserRole _selectedRole = UserRole.parent;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onRoleChanged(UserRole role) {
    setState(() {
      _selectedRole = role;
    });
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    final success = await authProvider.login(
      identifier: _identifierController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      Navigator.pushReplacementNamed(context, AppRoutes.roleRouter);
    } else {
      final error = authProvider.errorMessage ?? 'Login failed. Please check your credentials.';
      final currentUrl = LocalStorage.getBaseUrl();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          duration: const Duration(seconds: 6),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.white, size: 20),
                  const SizedBox(width: 10),
                  Expanded(child: Text(error)),
                ],
              ),
              if (error.contains('Cannot connect')) ...[
                const SizedBox(height: 4),
                Text(
                  'Server URL: $currentUrl',
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ],
          ),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          action: error.contains('Cannot connect')
              ? SnackBarAction(
                  label: 'Use Live Cloud',
                  textColor: Colors.amber,
                  onPressed: () async {
                    await LocalStorage.setCustomBaseUrl('https://vantrack-lk.onrender.com/api');
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Switched server to Live Render Cloud! Please tap Sign In again.'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  },
                )
              : null,
        ),
      );
    }
  }

  void _showServerSettingsDialog() {
    final serverController = TextEditingController(text: LocalStorage.getBaseUrl());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Server Configuration', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Specify the VanTrack LK backend API base URL:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: serverController,
              decoration: const InputDecoration(
                hintText: 'http://10.0.2.2:5000/api',
                prefixIcon: Icon(Icons.dns_rounded),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.cloud_done_rounded, size: 14, color: AppColors.accent),
                  label: const Text('Render Cloud (Live)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  onPressed: () => serverController.text = 'https://vantrack-lk.onrender.com/api',
                ),
                ActionChip(
                  label: const Text('Wi-Fi PC (192.168.1.4)', style: TextStyle(fontSize: 11)),
                  onPressed: () => serverController.text = 'http://192.168.1.4:5000/api',
                ),
                ActionChip(
                  label: const Text('Emulator (10.0.2.2)', style: TextStyle(fontSize: 11)),
                  onPressed: () => serverController.text = 'http://10.0.2.2:5000/api',
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Make sure your phone and PC are connected to the same Wi-Fi network and backend is running.',
              style: TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              await LocalStorage.setCustomBaseUrl(serverController.text.trim());
              if (ctx.mounted) {
                Navigator.pop(ctx);
              }
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Server URL updated')),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isLoading = authProvider.status == AuthStatus.loading;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        actions: [
          IconButton(
            tooltip: 'Server Settings',
            icon: const Icon(Icons.settings_outlined, color: AppColors.textSecondary),
            onPressed: _showServerSettingsDialog,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 10),
                const BrandHeader(iconSize: 58),
                const SizedBox(height: 28),

                // Role selection bar
                const Text(
                  'Select Your Portal',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                RoleSelectorChip(
                  selectedRole: _selectedRole,
                  onRoleChanged: _onRoleChanged,
                ),
                const SizedBox(height: 24),

                // Identifier field
                CustomTextField(
                  controller: _identifierController,
                  label: 'Email or Mobile Number',
                  hint: 'e.g. parent@vantrack.lk or 0771234567',
                  prefixIcon: Icons.person_outline_rounded,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) => Validators.required(v, 'Please enter email or phone number'),
                ),
                const SizedBox(height: 16),

                // Password field
                CustomTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hint: 'Enter your account password',
                  prefixIcon: Icons.lock_outline_rounded,
                  isPassword: true,
                  validator: Validators.password,
                ),
                const SizedBox(height: 10),

                // Forgot password link
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {
                      Navigator.pushNamed(context, AppRoutes.forgotPassword);
                    },
                    style: TextButton.styleFrom(
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(50, 30),
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: const Text(
                      'Forgot Password?',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.accentDark,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Submit button
                CustomButton(
                  text: 'Sign In as ${_selectedRole.shortName}',
                  isLoading: isLoading,
                  onPressed: _handleLogin,
                ),
                const SizedBox(height: 24),

                // Register redirect
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Don\'t have an account? ',
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          AppRoutes.register,
                          arguments: _selectedRole,
                        );
                      },
                      child: const Text(
                        'Register Now',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
