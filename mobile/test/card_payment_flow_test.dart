import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vantrack_lk/core/storage/local_storage.dart';
import 'package:vantrack_lk/models/invoice_model.dart';
import 'package:vantrack_lk/providers/invoice_provider.dart';
import 'package:vantrack_lk/screens/invoices/card_payment_screen.dart';
import 'package:vantrack_lk/services/invoice_service.dart';

/// In-memory stand-in for [InvoiceService] so the card payment flow can be
/// exercised without hitting the network or the PayHere gateway.
class _FakeInvoiceService extends InvoiceService {
  _FakeInvoiceService({this.card, this.payResult, this.payError});

  Map<String, dynamic>? card;
  Map<String, dynamic> summary = {
    'totalOutstanding': 15000.0,
    'totalPaid': 0.0,
    'unpaidCount': 2,
  };
  Map<String, dynamic>? payResult;
  Object? payError;
  int payCallCount = 0;

  @override
  Future<Map<String, dynamic>> getInvoices({String? status, String? studentId}) async {
    return {'invoices': <InvoiceModel>[], 'summary': summary};
  }

  @override
  Future<Map<String, dynamic>?> getSavedCard() async => card;

  @override
  Future<Map<String, dynamic>> payOutstandingByCard() async {
    payCallCount++;
    if (payError != null) throw payError!;
    return payResult ?? {};
  }
}

Widget _wrap(InvoiceProvider provider) {
  return ChangeNotifierProvider<InvoiceProvider>.value(
    value: provider,
    child: const MaterialApp(home: CardPaymentScreen()),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorage.init();
  });

  testWidgets('prompts to add a card when none is saved', (tester) async {
    final provider = InvoiceProvider(service: _FakeInvoiceService(card: null));

    await tester.pumpWidget(_wrap(provider));
    await tester.pumpAndSettle();

    expect(find.text('No card saved yet'), findsOneWidget);
    expect(find.text('Add Card Securely'), findsOneWidget);
    // Pay button is disabled until a card exists.
    final button = tester.widget<ElevatedButton>(find.byKey(const Key('card_pay_button')));
    expect(button.onPressed, isNull);
  });

  testWidgets('shows the saved card and forces a confirmation before charging', (tester) async {
    final service = _FakeInvoiceService(
      card: {
        'method': 'VISA',
        'cardHolderName': 'Kasun Jayawardena',
        'maskedCardNumber': '************4564',
        'cardExpiry': '1299',
        'isExpired': false,
      },
      payResult: {'paymentId': 'PH-9001', 'settledCount': 2, 'message': 'Payment received successfully.'},
    );
    final provider = InvoiceProvider(service: service);

    await tester.pumpWidget(_wrap(provider));
    await tester.pumpAndSettle();

    expect(find.text('************4564'), findsOneWidget);
    expect(find.text('Card saved & verified with PayHere'), findsOneWidget);

    // Tapping pay opens the confirmation dialog - no charge yet.
    final button = tester.widget<ElevatedButton>(find.byKey(const Key('card_pay_button')));
    expect(button.onPressed, isNotNull);
    await tester.tap(find.byKey(const Key('card_pay_button')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(AlertDialog), findsOneWidget);
    expect(find.text('Confirm Card Payment'), findsOneWidget);
    expect(service.payCallCount, 0);

    // Confirming charges the saved card once and shows the success dialog.
    await tester.tap(find.text('Confirm & Pay'));
    await tester.pumpAndSettle();

    expect(service.payCallCount, 1);
    expect(find.text('Payment Successful'), findsOneWidget);
    expect(find.textContaining('PH-9001'), findsOneWidget);
  });

  testWidgets('blocks payment and warns when the saved card has expired', (tester) async {
    final service = _FakeInvoiceService(
      card: {
        'method': 'MASTER',
        'cardHolderName': 'Kasun Jayawardena',
        'maskedCardNumber': '************1111',
        'cardExpiry': '0120',
        'isExpired': true,
      },
    );
    final provider = InvoiceProvider(service: service);

    await tester.pumpWidget(_wrap(provider));
    await tester.pumpAndSettle();

    expect(find.textContaining('This card has expired'), findsOneWidget);

    final button = tester.widget<ElevatedButton>(find.byKey(const Key('card_pay_button')));
    expect(button.onPressed, isNull);
  });

  testWidgets('surfaces a failed transaction with a retry option', (tester) async {
    final service = _FakeInvoiceService(
      card: {
        'method': 'VISA',
        'maskedCardNumber': '************4564',
        'cardExpiry': '1299',
        'isExpired': false,
      },
      payError: Exception('Card declined by issuing bank'),
    );
    final provider = InvoiceProvider(service: service);

    await tester.pumpWidget(_wrap(provider));
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('card_pay_button')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Confirm & Pay'));
    await tester.pumpAndSettle();

    expect(find.text('Payment Failed'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
    expect(service.payCallCount, 1);
  });
}
