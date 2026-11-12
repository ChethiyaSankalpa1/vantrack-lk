import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../config/app_colors.dart';
import '../../models/invoice_model.dart';
import '../../providers/invoice_provider.dart';
import 'digital_receipt_screen.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final _currencyFormat = NumberFormat.currency(locale: 'en_LK', symbol: 'Rs. ', decimalDigits: 2);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InvoiceProvider>().loadInvoices();
    });
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
                Text('Connecting to PayHere Secure Gateway...'),
              ],
            ),
          ),
        ),
      ),
    );

    final params = await provider.getPayHereCheckoutParams(invoice.id);
    if (!mounted) return;
    Navigator.pop(context); // Close loading dialog

    if (params != null) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Row(
            children: [
              Icon(Icons.lock_rounded, color: Colors.deepPurple),
              SizedBox(width: 8),
              Text('PayHere Gateway', style: TextStyle(fontSize: 16)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Order ID: ${params['order_id']}'),
              const SizedBox(height: 4),
              Text('Total Amount: Rs. ${params['amount']} LKR', style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text(
                'PayHere production/sandbox checkout session has been initialized. Once customer completes OTP verification, receipt will automatically unlock.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ],
        ),
      );
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
    final dateController = TextEditingController(text: DateTime.now().toIso8601String().split('T').first);
    final refController = TextEditingController();
    final urlController = TextEditingController();
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final currentAcc = bankAccounts.firstWhere(
            (a) => a['_id']?.toString() == selectedBankId,
            orElse: () => bankAccounts.first,
          );

          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.account_balance_rounded, color: AppColors.primary),
                SizedBox(width: 8),
                Text('Bank Deposit Receipt Form', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('1. Select Operator Bank Destination:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: selectedBankId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: bankAccounts.map((acc) {
                      final isDef = acc['isDefault'] == true;
                      return DropdownMenuItem<String>(
                        value: acc['_id'].toString(),
                        child: Text(
                          '${acc['bankName']} - ${acc['accountNumber']} ${isDef ? '(DEFAULT)' : ''}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setDialogState(() => selectedBankId = val);
                    },
                  ),
                  const SizedBox(height: 10),

                  // Selected Bank Account Highlight Card
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              currentAcc['bankName'] ?? 'Bank',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              icon: const Icon(Icons.copy_rounded, size: 16, color: AppColors.accent),
                              tooltip: 'Copy Account Number',
                              onPressed: () {
                                final num = currentAcc['accountNumber']?.toString() ?? '';
                                if (num.isNotEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Account number copied: $num')),
                                  );
                                }
                              },
                            ),
                          ],
                        ),
                        Text('Account No: ${currentAcc['accountNumber']}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.accentDark)),
                        Text('Holder: ${currentAcc['accountHolderName']}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        Text('Branch: ${currentAcc['branchName']}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  const Text('2. Enter Deposit & Receipt Details:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),

                  TextField(
                    controller: depositorController,
                    decoration: const InputDecoration(
                      labelText: 'Depositor Name *',
                      hintText: 'e.g., Kasun Jayawardena',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: dateController,
                    decoration: const InputDecoration(
                      labelText: 'Deposit Date (YYYY-MM-DD) *',
                      prefixIcon: Icon(Icons.calendar_today_rounded),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: refController,
                    decoration: const InputDecoration(
                      labelText: 'Bank Ref / Slip Number (Optional)',
                      hintText: 'e.g., CDM-84920 or Ref #',
                      prefixIcon: Icon(Icons.confirmation_number_outlined),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: urlController,
                    decoration: const InputDecoration(
                      labelText: 'Receipt Image URL / File Link *',
                      hintText: 'https://cloudinary.com/... or Slip Photo URL',
                      prefixIcon: Icon(Icons.link_rounded),
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: notesController,
                    decoration: const InputDecoration(
                      labelText: 'Additional Notes (Optional)',
                      hintText: 'e.g. Paid via CDM Maharagama',
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
                onPressed: () async {
                  final depName = depositorController.text.trim();
                  final depDate = dateController.text.trim();
                  final fileUrl = urlController.text.trim();

                  if (depName.isEmpty || depDate.isEmpty || fileUrl.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Please fill in Depositor Name, Date, and Receipt URL.')),
                    );
                    return;
                  }

                  Navigator.pop(ctx);
                  final ok = await provider.submitBankDeposit(
                    invoiceId: invoice.id,
                    bankAccountId: selectedBankId,
                    depositorName: depName,
                    depositDate: depDate,
                    depositReferenceNumber: refController.text.trim(),
                    receiptFileUrl: fileUrl,
                    notes: notesController.text.trim(),
                  );

                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(ok
                            ? 'Bank deposit slip submitted! Pending admin verification.'
                            : provider.errorMessage ?? 'Failed to submit bank deposit slip'),
                        backgroundColor: ok ? AppColors.success : AppColors.error,
                      ),
                    );
                  }
                },
                child: const Text('Submit Deposit Slip'),
              ),
            ],
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
}
