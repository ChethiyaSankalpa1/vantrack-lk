import 'package:flutter/material.dart';
import '../../config/app_colors.dart';
import '../../config/app_constants.dart';
import '../../core/storage/local_storage.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _urlController;
  bool _notificationsEnabled = true;
  bool _vibrationEnabled = true;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: LocalStorage.getBaseUrl());
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Application Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Server Configuration Section
          _buildSectionHeader('BACKEND SERVER & API'),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'API Base URL',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _urlController,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.dns_rounded),
                    hintText: 'https://vantrack-lk.onrender.com/api',
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.cloud_done_rounded, size: 14, color: AppColors.accent),
                      label: const Text('Render Cloud (Live)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      onPressed: () => setState(() => _urlController.text = 'https://vantrack-lk.onrender.com/api'),
                    ),
                    ActionChip(
                      label: const Text('Emulator (10.0.2.2)', style: TextStyle(fontSize: 11)),
                      onPressed: () => setState(() => _urlController.text = 'http://10.0.2.2:5000/api'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      final messenger = ScaffoldMessenger.of(context);
                      await LocalStorage.setCustomBaseUrl(_urlController.text.trim());
                      messenger.showSnackBar(
                        const SnackBar(content: Text('Server URL successfully updated!')),
                      );
                    },
                    child: const Text('Save Server Configuration'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Push Notifications Section
          _buildSectionHeader('PUSH NOTIFICATIONS'),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Boarding & Arrival Alerts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Get notified when student boards or drops off', style: TextStyle(fontSize: 12)),
                  value: _notificationsEnabled,
                  activeThumbColor: AppColors.accent,
                  onChanged: (v) => setState(() => _notificationsEnabled = v),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Haptic Vibration Alerts', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                  subtitle: const Text('Vibrate phone on urgent breakdown or delay alerts', style: TextStyle(fontSize: 12)),
                  value: _vibrationEnabled,
                  activeThumbColor: AppColors.accent,
                  onChanged: (v) => setState(() => _vibrationEnabled = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // About App Section
          _buildSectionHeader('ABOUT APPLICATION'),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Application Version', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    Text(AppConstants.appVersion, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('System Architecture', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    Text('Flutter + Node.js + MongoDB', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Designed For', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                    Text('Sri Lankan School Transport', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.textMuted,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}
