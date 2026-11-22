import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/app_colors.dart';
import '../config/app_constants.dart';
import '../models/parent_dashboard_model.dart';

class FeeStatusCard extends StatelessWidget {
  final InvoiceBrief? invoice;
  final VoidCallback onViewInvoices;

  const FeeStatusCard({
    super.key,
    this.invoice,
    required this.onViewInvoices,
  });

  @override
  Widget build(BuildContext context) {
    final hasInvoice = invoice != null;
    final isPaid = invoice?.status == 'paid';
    final amountFormatted = NumberFormat('#,##0').format(invoice?.amount ?? 0);
    final monthName = DateFormat('MMMM').format(DateTime.now());

    final Color statusColor = !hasInvoice
        ? AppColors.primary
        : isPaid
            ? AppColors.accent
            : AppColors.vanAmber;
    final IconData statusIcon = !hasInvoice
        ? Icons.receipt_long_outlined
        : isPaid
            ? Icons.check_circle_outline_rounded
            : Icons.receipt_long_rounded;

    final String title = !hasInvoice
        ? 'No Transport Fee Due'
        : isPaid
            ? 'Monthly Transport Fee Paid'
            : '$monthName Fee Pending';
    final String subtitle = !hasInvoice
        ? 'No transport fee invoice has been issued yet'
        : isPaid
            ? 'All invoices up to date ($amountFormatted ${AppConstants.currency})'
            : 'Amount Due: $amountFormatted ${AppConstants.currency}';
    final String actionLabel = isPaid ? 'History' : (!hasInvoice ? 'View Invoices' : 'Pay Now');

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              statusIcon,
              color: statusColor,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: isPaid ? AppColors.accentDark : statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: onViewInvoices,
            style: TextButton.styleFrom(
              foregroundColor: isPaid ? AppColors.primary : AppColors.accentDark,
              textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
            ),
            child: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}
