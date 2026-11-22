import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_colors.dart';
import '../../providers/invoice_provider.dart';

/// Pay the full outstanding balance with a credit / debit card.
///
/// Card data is never captured or stored by this app. The card is saved
/// (tokenised) on PayHere's PCI-DSS compliant page, and the one-time charge
/// for the whole outstanding balance is executed server-to-server.
class CardPaymentScreen extends StatefulWidget {
  const CardPaymentScreen({super.key});

  @override
  State<CardPaymentScreen> createState() => _CardPaymentScreenState();
}

class _CardPaymentScreenState extends State<CardPaymentScreen> with WidgetsBindingObserver {
  final _currencyFormat = NumberFormat.currency(locale: 'en_LK', symbol: 'Rs. ', decimalDigits: 2);
  bool _wasInBackground = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<InvoiceProvider>();
      provider.loadSavedCard();
      provider.loadInvoices();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // When the parent returns from PayHere's secure card page, refresh the
    // saved card so the freshly tokenised card appears immediately.
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _wasInBackground = true;
    } else if (state == AppLifecycleState.resumed && _wasInBackground) {
      _wasInBackground = false;
      context.read<InvoiceProvider>().loadSavedCard();
      context.read<InvoiceProvider>().loadInvoices();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InvoiceProvider>();
    final outstanding = provider.totalOutstanding;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Pay by Card'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              provider.loadSavedCard();
              provider.loadInvoices();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildOutstandingCard(outstanding, provider.unpaidCount),
          const SizedBox(height: 16),
          _buildCardSection(provider),
          const SizedBox(height: 16),
          _buildSecurityNote(),
          const SizedBox(height: 24),
        ],
      ),
      bottomNavigationBar: _buildPayButton(provider, outstanding),
    );
  }

  Widget _buildOutstandingCard(double outstanding, int unpaidCount) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TOTAL OUTSTANDING TO PAY',
            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.8),
          ),
          const SizedBox(height: 6),
          Text(
            _currencyFormat.format(outstanding),
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 8),
          Text(
            unpaidCount > 0
                ? 'Settles $unpaidCount unpaid invoice${unpaidCount > 1 ? 's' : ''} in a single card transaction.'
                : 'You have no outstanding balance to pay.',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildCardSection(InvoiceProvider provider) {
    if (provider.isCardLoading && provider.savedCard == null) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 40),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: const CircularProgressIndicator(),
      );
    }

    if (!provider.hasSavedCard) {
      return _buildNoCardState();
    }

    return _buildSavedCardState(provider.savedCard!);
  }

  Widget _buildNoCardState() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add_card_rounded, color: AppColors.accent),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'No card saved yet',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Add a Visa, Mastercard or Amex card. Your card details are entered only on '
            "PayHere's secure page and are never stored by VanTrack LK.",
            style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.lock_rounded, size: 18),
              label: const Text('Add Card Securely', style: TextStyle(fontWeight: FontWeight.w700)),
              onPressed: _handleAddCard,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSavedCardState(Map<String, dynamic> card) {
    final method = (card['method'] ?? 'CARD').toString().toUpperCase();
    final masked = (card['maskedCardNumber'] ?? '').toString();
    final holder = (card['cardHolderName'] ?? '').toString();
    final expiry = (card['cardExpiry'] ?? '').toString();
    final isExpired = card['isExpired'] == true;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isExpired ? AppColors.error.withValues(alpha: 0.4) : AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Icon(Icons.credit_card_rounded, color: Colors.white, size: 26),
                    Text(
                      method,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                Text(
                  masked.isEmpty ? '•••• •••• •••• ••••' : masked,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        holder.isEmpty ? 'Card Holder' : holder.toUpperCase(),
                        style: const TextStyle(color: Colors.white70, fontSize: 11, letterSpacing: 1),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      expiry.isEmpty ? 'MM/YY' : expiry,
                      style: const TextStyle(color: Colors.white70, fontSize: 11, letterSpacing: 1),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (isExpired)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.error_outline_rounded, color: AppColors.error, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'This card has expired. Please update your card to continue.',
                      style: TextStyle(fontSize: 12, color: AppColors.error, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            )
          else
            const Row(
              children: [
                Icon(Icons.verified_rounded, color: AppColors.success, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Card saved & verified with PayHere',
                    style: TextStyle(fontSize: 12, color: AppColors.success, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.cardBorder),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.autorenew_rounded, size: 16),
                  label: const Text('Update Card', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                  onPressed: _handleAddCard,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: BorderSide(color: AppColors.error.withValues(alpha: 0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.delete_outline_rounded, size: 16),
                  label: const Text('Remove', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                  onPressed: _confirmRemoveCard,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityNote() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.accentLight.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.shield_rounded, color: AppColors.accentDark, size: 18),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Secured by PayHere (PCI-DSS). VanTrack LK only stores a payment token — '
              'your full card number and CVV are never seen or saved by us.',
              style: TextStyle(fontSize: 11.5, color: AppColors.accentDark, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPayButton(InvoiceProvider provider, double outstanding) {
    final canPay = provider.hasSavedCard &&
        provider.savedCard?['isExpired'] != true &&
        outstanding > 0 &&
        !provider.isPaymentProcessing;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            key: const Key('card_pay_button'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accent,
              disabledBackgroundColor: AppColors.cardBorder,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: canPay ? () => _confirmAndPay(provider, outstanding) : null,
            child: provider.isPaymentProcessing
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Text(
                    outstanding > 0 ? 'Pay ${_currencyFormat.format(outstanding)} Now' : 'No Outstanding Balance',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleAddCard() async {
    final provider = context.read<InvoiceProvider>();
    final messenger = ScaffoldMessenger.of(context);

    final url = await provider.createCardTokeniseUrl();
    if (!mounted) return;

    if (url == null || url.isEmpty) {
      messenger.showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Could not start secure card setup. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    try {
      final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched && mounted) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Could not open the secure card page. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text('Failed to open card page: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _confirmRemoveCard() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Remove saved card?'),
        content: const Text(
          'Your card will be removed from VanTrack LK. You can add it again at any time. No charge will be made.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final provider = context.read<InvoiceProvider>();
    final messenger = ScaffoldMessenger.of(context);
    final ok = await provider.removeSavedCard();
    if (!mounted) return;
    messenger.showSnackBar(
      SnackBar(
        content: Text(ok ? 'Saved card removed.' : (provider.errorMessage ?? 'Failed to remove card.')),
        backgroundColor: ok ? AppColors.success : AppColors.error,
      ),
    );
  }

  Future<void> _confirmAndPay(InvoiceProvider provider, double outstanding) async {
    final card = provider.savedCard!;
    final masked = (card['maskedCardNumber'] ?? 'your saved card').toString();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Confirm Card Payment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'You are about to charge ${_currencyFormat.format(outstanding)} to $masked.',
              style: const TextStyle(fontSize: 13.5, height: 1.4),
            ),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.vanAmberLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'This single transaction settles all of your unpaid invoices.',
                style: TextStyle(fontSize: 11.5, color: AppColors.textPrimary),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirm & Pay', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;
    await _runPayment(provider);
  }

  Future<void> _runPayment(InvoiceProvider provider) async {
    // Local pre-flight validation (card presence / expiry / amount) is enforced
    // by the disabled pay button; the gateway re-validates the token server-side.
    final result = await provider.payOutstandingWithCard();
    if (!mounted) return;

    if (result['success'] == true) {
      await _showSuccessDialog(result);
    } else {
      await _showFailureDialog(
        provider,
        result['message']?.toString() ?? 'Payment was not completed.',
      );
    }
  }

  Future<void> _showSuccessDialog(Map<String, dynamic> result) async {
    final paymentId = (result['paymentId'] ?? '').toString();
    final settled = result['settledCount'] ?? 0;

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: const BoxDecoration(color: AppColors.accentLight, shape: BoxShape.circle),
              child: const Icon(Icons.check_rounded, color: AppColors.accentDark, size: 36),
            ),
            const SizedBox(height: 14),
            const Text('Payment Successful', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(
              result['message']?.toString() ?? 'Your card payment has been received.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            if (paymentId.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text('Ref: $paymentId', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
            if ((settled is num) && settled > 0) ...[
              const SizedBox(height: 4),
              Text('$settled invoice(s) settled', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ],
          ],
        ),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showFailureDialog(InvoiceProvider provider, String message) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.error_outline_rounded, color: AppColors.error),
            SizedBox(width: 8),
            Text('Payment Failed'),
          ],
        ),
        content: Text(message, style: const TextStyle(fontSize: 13.5, height: 1.4)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () {
              Navigator.pop(ctx);
              _runPayment(provider);
            },
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
