import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../config/app_colors.dart';
import '../../models/student_model.dart';

class StudentProfileScreen extends StatelessWidget {
  final StudentModel student;

  const StudentProfileScreen({super.key, required this.student});

  Future<void> _printOrDownloadPass(BuildContext context) async {
    final qrData = student.qrCodeString ?? 'VANTRACK_STU_${student.id}';
    final vehicle = student.assignedVehicle;

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async {
        final pdf = pw.Document();

        pdf.addPage(
          pw.Page(
            pageFormat: PdfPageFormat.a4,
            build: (pw.Context context) {
              return pw.Center(
                child: pw.Container(
                  width: 380,
                  padding: const pw.EdgeInsets.all(24),
                  decoration: pw.BoxDecoration(
                    borderRadius: pw.BorderRadius.circular(20),
                    border: pw.Border.all(color: PdfColors.blueGrey800, width: 2),
                    color: PdfColors.white,
                  ),
                  child: pw.Column(
                    mainAxisSize: pw.MainAxisSize.min,
                    children: [
                      // Header Brand Banner
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: pw.BoxDecoration(
                          color: PdfColors.blue900,
                          borderRadius: pw.BorderRadius.circular(10),
                        ),
                        child: pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text(
                              'VANTRACK LK',
                              style: pw.TextStyle(
                                color: PdfColors.amber400,
                                fontSize: 16,
                                fontWeight: pw.FontWeight.bold,
                              ),
                            ),
                            pw.Text(
                              'OFFICIAL SCHOOL VAN PASS',
                              style: pw.TextStyle(
                                color: PdfColors.white,
                                fontSize: 10,
                                fontWeight: pw.FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      pw.SizedBox(height: 16),

                      // Student Info Box
                      pw.Text(
                        student.name,
                        style: pw.TextStyle(
                          fontSize: 20,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.blueGrey900,
                        ),
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        '${student.grade} • ${student.schoolName}',
                        style: const pw.TextStyle(
                          fontSize: 12,
                          color: PdfColors.grey700,
                        ),
                      ),
                      if (student.admissionNumber != null) ...[
                        pw.SizedBox(height: 2),
                        pw.Text(
                          'Admission No: ${student.admissionNumber}',
                          style: const pw.TextStyle(
                            fontSize: 10,
                            color: PdfColors.grey600,
                          ),
                        ),
                      ],
                      pw.SizedBox(height: 16),
                      pw.Divider(color: PdfColors.grey300),
                      pw.SizedBox(height: 12),

                      // Printable QR Code Image
                      pw.Text(
                        'DIGITAL BOARDING & DROPOFF QR PASS',
                        style: pw.TextStyle(
                          fontSize: 11,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.blue900,
                        ),
                      ),
                      pw.SizedBox(height: 10),
                      pw.BarcodeWidget(
                        barcode: pw.Barcode.qrCode(),
                        data: qrData,
                        width: 160,
                        height: 160,
                      ),
                      pw.SizedBox(height: 8),
                      pw.Text(
                        qrData,
                        style: pw.TextStyle(
                          fontSize: 10,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.grey800,
                        ),
                      ),

                      pw.SizedBox(height: 16),
                      pw.Divider(color: PdfColors.grey300),
                      pw.SizedBox(height: 12),

                      // Transport Details Block
                      pw.Container(
                        padding: const pw.EdgeInsets.all(10),
                        decoration: pw.BoxDecoration(
                          color: PdfColors.grey100,
                          borderRadius: pw.BorderRadius.circular(10),
                        ),
                        child: pw.Column(
                          crossAxisAlignment: pw.CrossAxisAlignment.start,
                          children: [
                            pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text('Vehicle Plate:', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                                pw.Text(vehicle?.registrationNumber ?? 'WP NB-7842', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                              ],
                            ),
                            pw.SizedBox(height: 4),
                            pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text('Van Driver:', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                                pw.Text(vehicle?.driver?.name ?? 'Sunil Shantha', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                              ],
                            ),
                            pw.SizedBox(height: 4),
                            pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text('Driver Mobile:', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                                pw.Text(vehicle?.driver?.phone ?? '0783456789', style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                              ],
                            ),
                            pw.SizedBox(height: 4),
                            pw.Row(
                              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                              children: [
                                pw.Text('Morning Pickup:', style: pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                                pw.Text(student.pickupLocation.scheduledTime, style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                      ),

                      pw.SizedBox(height: 14),
                      pw.Text(
                        'Note for Parents: Print this pass or attach to your child\'s school bag. Drivers & attendants will scan this pass for real-time safety tracking.',
                        textAlign: pw.TextAlign.center,
                        style: const pw.TextStyle(
                          fontSize: 8.5,
                          color: PdfColors.grey600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );

        return pdf.save();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final qrData = student.qrCodeString ?? 'VANTRACK_STU_${student.id}';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Student Profile & Van Pass'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          children: [
            // Student Identity Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Photo & School info
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    backgroundImage: student.photoUrl != null &&
                            student.photoUrl!.isNotEmpty
                        ? NetworkImage(student.photoUrl!)
                        : null,
                    child: student.photoUrl == null || student.photoUrl!.isEmpty
                        ? Text(
                            student.name.isNotEmpty
                                ? student.name[0].toUpperCase()
                                : 'S',
                            style: const TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(height: 14),
                  Text(
                    student.name,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${student.grade} • ${student.schoolName}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (student.admissionNumber != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Admission: ${student.admissionNumber}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 16),

                  // QR Code for Boarding Attendance
                  const Text(
                    'Digital School Van Pass',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Driver or assistant will scan this QR code upon boarding or drop-off',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.cardBorder, width: 2),
                    ),
                    child: QrImageView(
                      data: qrData,
                      version: QrVersions.auto,
                      size: 160.0,
                      eyeStyle: const QrEyeStyle(
                        eyeShape: QrEyeShape.square,
                        color: AppColors.primary,
                      ),
                      dataModuleStyle: const QrDataModuleStyle(
                        dataModuleShape: QrDataModuleShape.square,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    qrData,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Print & Download Van Pass Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      icon: const Icon(Icons.print_rounded, size: 20),
                      label: const Text(
                        'Print & Download Van Pass 🖨️',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      onPressed: () => _printOrDownloadPass(context),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Assigned Van & Driver Info
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Transportation Details',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildDetailRow(
                    'Vehicle Plate',
                    student.assignedVehicle?.registrationNumber ?? 'Unassigned',
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Van Model',
                    student.assignedVehicle?.makeModel ?? 'Standard Van',
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Van Driver',
                    student.assignedVehicle?.driver?.name ?? 'Assigned Driver',
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Driver Mobile',
                    student.assignedVehicle?.driver?.phone ?? '0783456789',
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Morning Pickup',
                    '${student.pickupLocation.scheduledTime} (${student.pickupLocation.address})',
                  ),
                  const SizedBox(height: 8),
                  _buildDetailRow(
                    'Afternoon Drop',
                    '${student.dropoffLocation.scheduledTime} (${student.dropoffLocation.address})',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
