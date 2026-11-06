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
    final isPaid = invoice == null || invoice!.status == 'paid';
    final amountFormatted = NumberFormat('#,##0').format(invoice?.amount ?? 7500);

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
              color: (isPaid ? AppColors.accent : AppColors.vanAmber)
                  .withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isPaid ? Icons.check_circle_outline_rounded : Icons.receipt_long_rounded,
              color: isPaid ? AppColors.accent : AppColors.vanAmber,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isPaid ? 'Monthly Transport Fee Paid' : 'November Fee Pending',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  isPaid
                      ? 'All invoices up to date ($amountFormatted ${AppConstants.currency})'
                      : 'Amount Due: $amountFormatted ${AppConstants.currency}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isPaid ? AppColors.accentDark : AppColors.vanAmber,
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
            child: Text(isPaid ? 'History' : 'Pay Now'),
          ),
        ],
      ),
    );
  }
}
