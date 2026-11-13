import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/app_colors.dart';
import '../../services/attendance_service.dart';

class QrScannerScreen extends StatefulWidget {
  final String tripId;
  final String initialMode; // 'boarded' or 'dropped_off'

  const QrScannerScreen({
    super.key,
    required this.tripId,
    this.initialMode = 'boarded',
  });

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final AttendanceService _service = AttendanceService();
  late MobileScannerController _scannerController;

  late String _scanMode; // 'boarded' or 'dropped_off'
  bool _isProcessing = false;
  bool _isTorchOn = false;
  String? _lastScannedCode;

  @override
  void initState() {
    super.initState();
    _scanMode = widget.initialMode;
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: const Text(
          'Student QR Attendance',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
        ),
        actions: [
          IconButton(
            tooltip: 'Toggle Flashlight',
            icon: Icon(
              _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
              color: _isTorchOn ? AppColors.accent : Colors.white70,
            ),
            onPressed: () async {
              try {
                await _scannerController.toggleTorch();
                setState(() => _isTorchOn = !_isTorchOn);
              } catch (_) {}
            },
          ),
          IconButton(
            tooltip: 'Flip Camera',
            icon: const Icon(Icons.cameraswitch_rounded, color: Colors.white70),
            onPressed: () => _scannerController.switchCamera(),
          ),
          IconButton(
            tooltip: 'Manual Code Entry',
            icon: const Icon(Icons.keyboard_alt_rounded, color: Colors.white70),
            onPressed: _showManualCodeDialog,
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Stack(
        children: [
          // Camera scanner viewfinder
          MobileScanner(
            controller: _scannerController,
            errorBuilder: (context, error, child) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.camera_alt_outlined, size: 64, color: Colors.white54),
                      const SizedBox(height: 16),
                      const Text(
                        'Camera Access Required',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Please grant camera permission in Android Settings or tap below to enter pass code manually.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
                        icon: const Icon(Icons.keyboard_alt_rounded),
                        label: const Text('Enter Pass Code Manually'),
                        onPressed: _showManualCodeDialog,
                      ),
                    ],
                  ),
                ),
              );
            },
            onDetect: (capture) {
              if (_isProcessing) return;
              final barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                final code = barcode.rawValue;
                if (code != null && code.isNotEmpty && code != _lastScannedCode) {
                  _handleScannedCode(code);
                  break;
                }
              }
            },
          ),

          // Scanning Target Overlay
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(
                  color: _scanMode == 'boarded' ? AppColors.accent : AppColors.info,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Stack(
                children: [
                  // Corner brackets
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _scanMode == 'boarded' ? 'PICKUP PASS' : 'DROPOFF PASS',
                        style: TextStyle(
                          color: _scanMode == 'boarded' ? AppColors.accent : AppColors.info,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ),
                  if (_isProcessing)
                    const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                ],
              ),
            ),
          ),

          // Top Mode Switcher Bar
          Positioned(
            top: 16,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white24),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _scanMode = 'boarded'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _scanMode == 'boarded' ? AppColors.accent : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.login_rounded, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            Text(
                              'Boarding Mode',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: _scanMode == 'boarded'
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _scanMode = 'dropped_off'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _scanMode == 'dropped_off' ? AppColors.info : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.logout_rounded, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            Text(
                              'Drop-off Mode',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: _scanMode == 'dropped_off'
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom instruction card
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black87.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white12),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.accent.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.accent),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Point at Student\'s Van Pass',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Parents will receive an instant notification.',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleScannedCode(String qrCode) async {
    setState(() {
      _isProcessing = true;
      _lastScannedCode = qrCode;
    });

    try {
      final result = await _service.scanQrCode(
        qrCodeString: qrCode,
        tripId: widget.tripId,
        status: _scanMode,
      );

      if (mounted) {
        _showSuccessSheet(result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('⚠️ Scan failed: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showSuccessSheet(Map<String, dynamic> attendance) {
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: _scanMode == 'boarded'
                      ? AppColors.accent.withValues(alpha: 0.15)
                      : AppColors.info.withValues(alpha: 0.15),
                  child: Icon(
                    _scanMode == 'boarded' ? Icons.check_circle_rounded : Icons.home_rounded,
                    color: _scanMode == 'boarded' ? AppColors.accent : AppColors.info,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _scanMode == 'boarded' ? 'Boarding Verified!' : 'Drop-off Verified!',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Parent notified in real-time.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Method:', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  Row(
                    children: const [
                      Icon(Icons.qr_code_rounded, size: 14, color: AppColors.accent),
                      SizedBox(width: 4),
                      Text('Digital QR Pass', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                // Allow scanning the next student
                setState(() => _lastScannedCode = null);
              },
              child: const Text(
                'Scan Next Student',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showManualCodeDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Enter Pass Code', style: TextStyle(fontSize: 17)),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'VT-STU-XXXXXXXX',
            prefixIcon: Icon(Icons.badge_rounded),
          ),
          textCapitalization: TextCapitalization.characters,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              final code = controller.text.trim();
              if (code.isNotEmpty) {
                _handleScannedCode(code);
              }
            },
            child: const Text('Verify'),
          ),
        ],
      ),
    );
  }
}
