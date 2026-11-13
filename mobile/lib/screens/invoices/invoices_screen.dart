import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_colors.dart';
import '../../core/storage/local_storage.dart';
import '../../models/invoice_model.dart';
import '../../providers/invoice_provider.dart';
import '../../services/upload_service.dart';
import 'digital_receipt_screen.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> with WidgetsBindingObserver {
  final _currencyFormat = NumberFormat.currency(locale: 'en_LK', symbol: 'Rs. ', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InvoiceProvider>().loadInvoices();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      context.read<InvoiceProvider>().loadInvoices();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InvoiceProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Monthly Invoices & Fees'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => provider.loadInvoices(),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // Total Balance Overview Header
          _buildSummaryHeader(provider),

          // Status Filter Tabs
          _buildTabBar(provider),

          // Invoice List
          Expanded(
            child: provider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : provider.errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                            const SizedBox(height: 12),
                            Text(provider.errorMessage!),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () => provider.loadInvoices(),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : provider.invoices.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.receipt_long_outlined, size: 56, color: AppColors.textMuted),
                                SizedBox(height: 12),
                                Text(
                                  'No Invoices Found',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Monthly transportation invoices will appear here automatically.',
                                  style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: () => provider.loadInvoices(),
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: provider.invoices.length,
                              itemBuilder: (ctx, index) {
                                return _buildInvoiceCard(provider, provider.invoices[index]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryHeader(InvoiceProvider provider) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      color: AppColors.primary,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'OUTSTANDING TRANSPORT FEES',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _currencyFormat.format(provider.totalOutstanding),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildMiniStat('Unpaid Invoices', '${provider.unpaidCount}', AppColors.warning),
              const SizedBox(width: 16),
              _buildMiniStat('Total Paid This Year', _currencyFormat.format(provider.totalPaid), AppColors.accent),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 10)),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }

  Widget _buildTabBar(InvoiceProvider provider) {
    final tabs = [
      {'key': 'all', 'label': 'All'},
      {'key': 'unpaid', 'label': 'Due / Unpaid'},
      {'key': 'pending_verification', 'label': 'Pending'},
      {'key': 'paid', 'label': 'Paid Receipts'},
    ];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: tabs.map((t) {
            final isSelected = provider.activeTab == t['key'];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(t['label']!),
                selected: isSelected,
                selectedColor: AppColors.primary,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 12,
                ),
                onSelected: (_) => provider.setActiveTab(t['key']!),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildInvoiceCard(InvoiceProvider provider, InvoiceModel invoice) {
    final statusColor = _getStatusColor(invoice.status);
    final statusLabel = _getStatusLabel(invoice.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Number & Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_rounded, size: 16, color: AppColors.primary),
                    const SizedBox(width: 6),
                    Text(
                      invoice.invoiceNumber,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 12),

            // Student & Month details
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        invoice.studentName,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${invoice.schoolName} • Grade ${invoice.grade}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Period: ${invoice.monthYear}  •  Due: ${_formatDate(invoice.dueDate)}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _currencyFormat.format(invoice.amount),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      invoice.currency,
                      style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Actions row
            Row(
              children: [
                if (invoice.isPaid)
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.success,
                        side: const BorderSide(color: AppColors.success),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.verified_rounded, size: 16),
                      label: const Text('Digital Receipt', style: TextStyle(fontWeight: FontWeight.w700)),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => DigitalReceiptScreen(invoice: invoice),
                          ),
                        );
                      },
                    ),
                  )
                else if (invoice.isPending)
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.hourglass_top_rounded, size: 14, color: AppColors.warning),
                            SizedBox(width: 6),
                            Text(
                              'Payment Slip Under Verification',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.warning,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.payment_rounded, size: 16),
                      label: const Text('Pay Transport Fee', style: TextStyle(fontWeight: FontWeight.w700)),
                      onPressed: () => _showPaymentOptions(provider, invoice),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showPaymentOptions(InvoiceProvider provider, InvoiceModel invoice) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
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
            Text(
              'Pay Invoice ${invoice.invoiceNumber}',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            Text(
              'Amount: ${_currencyFormat.format(invoice.amount)} for ${invoice.studentName}',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),

            // Option 1: PayHere Online Gateway
            _buildPaymentOptionTile(
              icon: Icons.credit_card_rounded,
              color: Colors.deepPurple,
              title: 'PayHere Online Gateway',
              subtitle: 'Visa, Mastercard, eZ Cash, mCash, Genie',
              badge: 'RECOMMENDED',
              onTap: () async {
                Navigator.pop(ctx);
                _handlePayHereCheckout(provider, invoice);
              },
            ),
            const SizedBox(height: 12),

            // Option 2: Upload Bank Transfer Slip
            _buildPaymentOptionTile(
              icon: Icons.account_balance_rounded,
              color: AppColors.primary,
              title: 'Upload Bank Deposit Slip',
              subtitle: 'Direct transfer to operator Commercial / BOC account',
              badge: 'MANUAL SLIP',
              onTap: () {
                Navigator.pop(ctx);
                _showBankSlipDialog(provider, invoice);
              },
            ),
            const SizedBox(height: 12),

            // Option 3: Cash to Driver
            _buildPaymentOptionTile(
              icon: Icons.payments_rounded,
              color: AppColors.vanAmber,
              title: 'Cash Payment to Driver / Assistant',
              subtitle: 'Pay directly inside the school van & receive digital receipt',
              badge: 'IN-PERSON',
              onTap: () {
                Navigator.pop(ctx);
                _showCashInstructions(invoice);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentOptionTile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String badge,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: color,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handlePayHereCheckout(InvoiceProvider provider, InvoiceModel invoice) async {
    final baseUrl = LocalStorage.getBaseUrl().replaceAll(RegExp(r'/+$'), '');
    final checkoutUrl = '$baseUrl/invoices/payhere/checkout-page/${invoice.id}';
    final uri = Uri.parse(checkoutUrl);

    try {
      final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!launched) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not open the payment page. Please try again.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'PayHere checkout opened. Complete your payment, then return to the app — your receipt will unlock automatically.',
            ),
            backgroundColor: AppColors.primary,
            duration: const Duration(seconds: 6),
            action: SnackBarAction(
              label: 'OK',
              textColor: Colors.white,
              onPressed: () {},
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to open payment gateway: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _showBankSlipDialog(InvoiceProvider provider, InvoiceModel invoice) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Loading Operator Bank Accounts...'),
              ],
            ),
          ),
        ),
      ),
    );

    final bankAccounts = await provider.getActiveBankAccounts();
    if (!mounted) return;
    Navigator.pop(context); // Close loading dialog

    if (bankAccounts.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No active bank accounts found. Please use PayHere Online or Cash Payment.'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    String selectedBankId = bankAccounts.first['_id']?.toString() ?? '';
    final depositorController = TextEditingController();
    final dateController = TextEditingController(
      text: DateFormat('yyyy-MM-dd').format(DateTime.now()),
    );
    final refController = TextEditingController();
    final notesController = TextEditingController();

    File? selectedReceiptFile;
    String? selectedReceiptFileName;
    String? uploadedReceiptUrl;
    bool isUploading = false;
    bool isSubmitting = false;

    final picker = ImagePicker();
    final uploadService = UploadService();

    bool isImageFile(File file) {
      final ext = file.path.split('.').last.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp', 'heic'].contains(ext);
    }

    bool isPdfFile(File file) {
      return file.path.split('.').last.toLowerCase() == 'pdf';
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final currentAcc = bankAccounts.firstWhere(
            (a) => a['_id']?.toString() == selectedBankId,
            orElse: () => bankAccounts.first,
          );

          Future<void> pickReceiptImage(ImageSource source) async {
            try {
              final XFile? picked = await picker.pickImage(
                source: source,
                imageQuality: 80,
                maxWidth: 1200,
              );
              if (picked != null) {
                selectedReceiptFile = File(picked.path);
                selectedReceiptFileName = picked.name;
                uploadedReceiptUrl = null;
                setDialogState(() {});
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to pick image: $e'), backgroundColor: AppColors.error),
                );
              }
            }
          }

          Future<void> pickReceiptFile() async {
            try {
              final FilePickerResult? result = await FilePicker.platform.pickFiles(
                type: FileType.custom,
                allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
                withData: false,
              );
              if (result != null && result.files.single.path != null) {
                final pickedFile = result.files.single;
                final file = File(pickedFile.path!);
                if (!isImageFile(file) && !isPdfFile(file)) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Only JPG, PNG, WEBP images and PDF files are allowed.'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                  return;
                }
                selectedReceiptFile = file;
                selectedReceiptFileName = pickedFile.name;
                uploadedReceiptUrl = null;
                setDialogState(() {});
              }
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Failed to pick file: $e'), backgroundColor: AppColors.error),
                );
              }
            }
          }

          return DraggableScrollableSheet(
            initialChildSize: 0.92,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            builder: (context, scrollController) => Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  // Drag handle
                  Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 4),
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  // Header
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
                          child: const Icon(Icons.account_balance_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Bank Deposit Receipt',
                                style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800),
                              ),
                              Text(
                                'Submit your payment slip for verification',
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

                  // Body
                  Expanded(
                    child: SingleChildScrollView(
                      controller: scrollController,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Section 1: Bank Account
                          _buildSectionLabel(Icons.account_balance_wallet_rounded, '1. Select Bank Account'),
                          const SizedBox(height: 10),
                          DropdownButtonFormField<String>(
                            initialValue: selectedBankId,
                            isExpanded: true,
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                              prefixIcon: const Icon(Icons.account_balance_rounded, color: AppColors.primary),
                            ),
                            items: bankAccounts.map((acc) {
                              final isDef = acc['isDefault'] == true;
                              return DropdownMenuItem<String>(
                                value: acc['_id'].toString(),
                                child: Text(
                                  '${acc['bankName']} • ${acc['accountNumber']}${isDef ? '  ★' : ''}',
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setDialogState(() => selectedBankId = val);
                            },
                          ),
                          const SizedBox(height: 12),

                          // Account detail card
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        currentAcc['bankName'] ?? 'Bank',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.primary),
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () {
                                        final num = currentAcc['accountNumber']?.toString() ?? '';
                                        if (num.isNotEmpty) {
                                          Clipboard.setData(ClipboardData(text: num));
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text('Account number copied: $num'), backgroundColor: AppColors.success),
                                          );
                                        }
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.accent.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.copy_rounded, size: 14, color: AppColors.accent),
                                            SizedBox(width: 4),
                                            Text('Copy', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.accent)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                _buildAccountDetailRow('Account No', currentAcc['accountNumber']?.toString() ?? '—', isHighlight: true),
                                _buildAccountDetailRow('Holder', currentAcc['accountHolderName']?.toString() ?? '—'),
                                _buildAccountDetailRow('Branch', currentAcc['branchName']?.toString() ?? '—'),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Section 2: Deposit Details
                          _buildSectionLabel(Icons.receipt_long_rounded, '2. Deposit Details'),
                          const SizedBox(height: 10),

                          // Depositor Name
                          TextField(
                            controller: depositorController,
                            decoration: InputDecoration(
                              labelText: 'Depositor Name *',
                              hintText: 'e.g., Kasun Jayawardena',
                              prefixIcon: const Icon(Icons.person_outline_rounded, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Deposit Date (date picker)
                          TextField(
                            controller: dateController,
                            readOnly: true,
                            onTap: () async {
                              final picked = await showDatePicker(
                                context: context,
                                initialDate: DateTime.now(),
                                firstDate: DateTime(2020),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                                builder: (context, child) {
                                  return Theme(
                                    data: Theme.of(context).copyWith(
                                      colorScheme: const ColorScheme.light(
                                        primary: AppColors.primary,
                                        onPrimary: Colors.white,
                                        surface: Colors.white,
                                        onSurface: AppColors.textPrimary,
                                      ),
                                    ),
                                    child: child!,
                                  );
                                },
                              );
                              if (picked != null) {
                                dateController.text = DateFormat('yyyy-MM-dd').format(picked);
                                setDialogState(() {});
                              }
                            },
                            decoration: InputDecoration(
                              labelText: 'Deposit Date *',
                              prefixIcon: const Icon(Icons.calendar_today_rounded, color: AppColors.primary),
                              suffixIcon: const Icon(Icons.arrow_drop_down_rounded, color: AppColors.textMuted),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Reference Number
                          TextField(
                            controller: refController,
                            decoration: InputDecoration(
                              labelText: 'Bank Ref / Slip No.',
                              hintText: 'e.g., CDM-84920',
                              prefixIcon: const Icon(Icons.confirmation_number_outlined, color: AppColors.primary),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Section 3: Receipt File
                          _buildSectionLabel(Icons.attach_file_rounded, '3. Receipt File *'),
                          const SizedBox(height: 10),

                          if (selectedReceiptFile != null)
                            Stack(
                              children: [
                                Container(
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: AppColors.background,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: AppColors.cardBorder),
                                  ),
                                  child: isImageFile(selectedReceiptFile!)
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(14),
                                          child: Image.file(
                                            selectedReceiptFile!,
                                            width: double.infinity,
                                            height: 200,
                                            fit: BoxFit.cover,
                                          ),
                                        )
                                      : Padding(
                                          padding: const EdgeInsets.all(16),
                                          child: Row(
                                            children: [
                                              Container(
                                                width: 56,
                                                height: 56,
                                                decoration: BoxDecoration(
                                                  color: AppColors.error.withValues(alpha: 0.1),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: const Icon(
                                                  Icons.picture_as_pdf_rounded,
                                                  color: AppColors.error,
                                                  size: 32,
                                                ),
                                              ),
                                              const SizedBox(width: 14),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      selectedReceiptFileName ?? 'receipt.pdf',
                                                      style: const TextStyle(
                                                        fontWeight: FontWeight.w700,
                                                        fontSize: 14,
                                                        color: AppColors.textPrimary,
                                                      ),
                                                      maxLines: 2,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      'PDF Document',
                                                      style: TextStyle(
                                                        fontSize: 12,
                                                        color: AppColors.textSecondary,
                                                        fontWeight: FontWeight.w500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: () {
                                      selectedReceiptFile = null;
                                      selectedReceiptFileName = null;
                                      uploadedReceiptUrl = null;
                                      setDialogState(() {});
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                                    ),
                                  ),
                                ),
                                if (isUploading)
                                  Positioned.fill(
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: Colors.black45,
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: const Center(
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            CircularProgressIndicator(color: Colors.white),
                                            SizedBox(height: 8),
                                            Text('Uploading...', style: TextStyle(color: Colors.white, fontSize: 12)),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                              ],
                            )
                          else
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppColors.cardBorder),
                              ),
                              child: Column(
                                children: [
                                  Icon(Icons.upload_file_rounded, size: 40, color: AppColors.textMuted),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'No receipt file selected',
                                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'Upload a clear photo or PDF of the deposit slip',
                                    style: TextStyle(color: AppColors.textMuted, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          const SizedBox(height: 12),

                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    side: const BorderSide(color: AppColors.primary),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  icon: const Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 18),
                                  label: const Text('Camera', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 12)),
                                  onPressed: () => pickReceiptImage(ImageSource.camera),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    side: const BorderSide(color: AppColors.primary),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  icon: const Icon(Icons.photo_library_rounded, color: AppColors.primary, size: 18),
                                  label: const Text('Gallery', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 12)),
                                  onPressed: () => pickReceiptImage(ImageSource.gallery),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    side: const BorderSide(color: AppColors.accent),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  icon: const Icon(Icons.folder_open_rounded, color: AppColors.accent, size: 18),
                                  label: const Text('Files', style: TextStyle(color: AppColors.accent, fontWeight: FontWeight.w600, fontSize: 12)),
                                  onPressed: pickReceiptFile,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Accepted: JPG, PNG, WEBP, PDF (max 10 MB)',
                            style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                          ),

                          const SizedBox(height: 24),

                          // Section 4: Notes
                          _buildSectionLabel(Icons.notes_rounded, '4. Additional Notes (Optional)'),
                          const SizedBox(height: 10),
                          TextField(
                            controller: notesController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              hintText: 'e.g., Paid via CDM at Maharagama branch',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                              contentPadding: const EdgeInsets.all(14),
                            ),
                          ),

                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),

                  // Submit Button
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
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                final depName = depositorController.text.trim();
                                final depDate = dateController.text.trim();

                                if (depName.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please enter the depositor name.'), backgroundColor: AppColors.error),
                                  );
                                  return;
                                }
                                if (depDate.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please select the deposit date.'), backgroundColor: AppColors.error),
                                  );
                                  return;
                                }
                                if (selectedReceiptFile == null) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Please add a receipt file (image or PDF).'), backgroundColor: AppColors.error),
                                  );
                                  return;
                                }

                                setDialogState(() => isSubmitting = true);

                                try {
                                  // Upload receipt file first
                                  setDialogState(() => isUploading = true);
                                  final result = await uploadService.uploadFile(
                                    file: selectedReceiptFile!,
                                    type: 'receipt',
                                  );
                                  uploadedReceiptUrl = result.url;
                                  setDialogState(() => isUploading = false);

                                  // Submit bank deposit
                                  final ok = await provider.submitBankDeposit(
                                    invoiceId: invoice.id,
                                    bankAccountId: selectedBankId,
                                    depositorName: depName,
                                    depositDate: depDate,
                                    depositReferenceNumber: refController.text.trim(),
                                    receiptFileUrl: uploadedReceiptUrl!,
                                    notes: notesController.text.trim(),
                                  );

                                  if (context.mounted) {
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(ok
                                            ? 'Deposit slip submitted! Pending verification.'
                                            : provider.errorMessage ?? 'Failed to submit.'),
                                        backgroundColor: ok ? AppColors.success : AppColors.error,
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
                                    );
                                  }
                                } finally {
                                  if (context.mounted) {
                                    setDialogState(() {
                                      isSubmitting = false;
                                      isUploading = false;
                                    });
                                  }
                                }
                              },
                        child: isSubmitting
                            ? const SizedBox(
                                height: 22,
                                width: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Text(
                                'Submit Deposit Slip',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15),
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
    );
  }

  void _showCashInstructions(InvoiceModel invoice) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.payments_rounded, color: AppColors.vanAmber),
            SizedBox(width: 8),
            Text('Cash to Driver / Assistant'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You can hand the exact monthly fee (${_currencyFormat.format(invoice.amount)}) directly to your van Driver or Assistant inside the school van.',
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.vanAmber.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.vanAmber.withValues(alpha: 0.3)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('💡 How In-Person Cash Verification Works:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.textPrimary)),
                  SizedBox(height: 4),
                  Text('1. Hand the cash to Driver Sunil Shantha or Assistant Kamal Bandara.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  Text('2. The Driver/Assistant taps "Confirm Cash Received" on their terminal.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  Text('3. You instantly receive a payment notification & digital receipt!', style: TextStyle(fontSize: 11, color: AppColors.accentDark, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Understood')),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'paid':
        return AppColors.success;
      case 'pending_verification':
        return AppColors.warning;
      case 'overdue':
        return AppColors.error;
      case 'unpaid':
      default:
        return AppColors.error;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'paid':
        return 'PAID & VERIFIED';
      case 'pending_verification':
        return 'PENDING VERIFICATION';
      case 'overdue':
        return 'OVERDUE';
      case 'unpaid':
      default:
        return 'PAYMENT DUE';
    }
  }

  String _formatDate(DateTime dt) {
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  Widget _buildSectionLabel(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
      ],
    );
  }

  Widget _buildAccountDetailRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isHighlight ? FontWeight.w800 : FontWeight.w600,
                color: isHighlight ? AppColors.accent : AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
