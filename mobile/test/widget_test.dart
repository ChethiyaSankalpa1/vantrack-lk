import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vantrack_lk/core/storage/local_storage.dart';
import 'package:vantrack_lk/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await LocalStorage.init();
  });

  testWidgets('VanTrack App splash screen renders cleanly', (WidgetTester tester) async {
    await tester.pumpWidget(const VanTrackApp());
    expect(find.text('VanTrack'), findsOneWidget);
    expect(find.text('LK'), findsOneWidget);

    // Let splash timer finish and transition to onboarding
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    expect(find.text('Skip'), findsOneWidget);
  });
}
