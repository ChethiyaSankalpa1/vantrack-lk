import 'package:flutter/material.dart';
import '../../config/app_colors.dart';
import '../../core/errors/api_exception.dart';
import '../../core/utils/validators.dart';
import '../../services/auth_service.dart';
import '../../widgets/brand_header.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _authService = AuthService();

  bool _isOtpSent = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _identifierController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    if (_identifierController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter your email or mobile number'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final msg = await _authService.requestPasswordReset(_identifierController.text);
      if (!mounted) return;
      setState(() => _isOtpSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: AppColors.success),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: AppColors.error),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final msg = await _authService.resetPassword(
        identifier: _identifierController.text,
        otp: _otpController.text,
        newPassword: _newPasswordController.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(msg), backgroundColor: AppColors.success),
      );
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message), backgroundColor: AppColors.error),
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
        title: const Text('Reset Password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 10),
                const Center(child: BrandHeader(iconSize: 52, showTagline: false)),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        _isOtpSent ? Icons.lock_reset_rounded : Icons.mark_email_read_outlined,
                        size: 48,
                        color: AppColors.primary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _isOtpSent ? 'Verify OTP & Set Password' : 'Forgot Your Password?',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _isOtpSent
                            ? 'Enter the 6-digit verification code sent to your email/phone and enter your new password.'
                            : 'Enter your registered email address or mobile phone number to receive a verification OTP.',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                CustomTextField(
                  controller: _identifierController,
                  label: 'Registered Email or Phone',
                  hint: 'e.g. parent@vantrack.lk or 0771234567',
                  prefixIcon: Icons.contact_mail_outlined,
                  enabled: !_isOtpSent,
                ),
                const SizedBox(height: 16),

                if (_isOtpSent) ...[
                  CustomTextField(
                    controller: _otpController,
                    label: '6-Digit Verification Code',
                    hint: '123456',
                    prefixIcon: Icons.security_rounded,
                    keyboardType: TextInputType.number,
                    validator: (v) => Validators.required(v, 'Please enter the OTP code'),
                  ),
                  const SizedBox(height: 16),
                  CustomTextField(
                    controller: _newPasswordController,
                    label: 'New Password',
                    hint: 'At least 6 characters',
                    prefixIcon: Icons.lock_outline_rounded,
                    isPassword: true,
                    validator: Validators.password,
                  ),
                  const SizedBox(height: 24),
                  CustomButton(
                    text: 'Update Password',
                    isLoading: _isLoading,
                    onPressed: _handleResetPassword,
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () => setState(() => _isOtpSent = false),
                    child: const Text('Resend Code or Change Email/Phone'),
                  ),
                ] else ...[
                  CustomButton(
                    text: 'Send Verification Code',
                    isLoading: _isLoading,
                    onPressed: _handleSendOtp,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
