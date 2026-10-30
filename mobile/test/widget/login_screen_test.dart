import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:routemate/core/localization/app_localizations.dart';
import 'package:routemate/core/widgets/design_system.dart';
import 'package:routemate/features/auth/screens/login_screen.dart';

void main() {
  Widget createTestWidget() {
    return const ProviderScope(
      child: MaterialApp(
        locale: Locale('en'),
        localizationsDelegates: [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: LoginScreen(),
      ),
    );
  }

  testWidgets('LoginScreen renders sliding role selector and no server settings button', (tester) async {
    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    // Verify RMLogo is present
    expect(find.byType(RMLogo), findsOneWidget);

    // Verify sliding segmented role bar is present
    expect(find.byType(RMSlidingSegmentedBar), findsOneWidget);
    expect(find.text('Traveller'), findsOneWidget);
    expect(find.text('Local Guide'), findsOneWidget);

    // Verify server settings icon is NOT in the AppBar
    expect(find.byIcon(Icons.dns_rounded), findsNothing);
    expect(find.byIcon(Icons.wifi_tethering), findsNothing);

    // Verify Forgot Password button is present
    expect(find.text('Forgot password?'), findsOneWidget);

    // Verify role sliding toggle works
    await tester.tap(find.text('Local Guide'));
    await tester.pumpAndSettle();
    expect(find.text('Guide Sign In'), findsOneWidget);

    // Toggle back to Traveller
    await tester.tap(find.text('Traveller'));
    await tester.pumpAndSettle();
    expect(find.text('Welcome Back'), findsOneWidget);
  });

  testWidgets('Forgot Password modal opens 2-step OTP flow', (tester) async {
    await tester.pumpWidget(createTestWidget());
    await tester.pumpAndSettle();

    // Tap Forgot password?
    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();

    // Verify Step 1 bottom sheet modal opens
    expect(find.text('Reset Password'), findsOneWidget);
    expect(find.text('Send Verification Code'), findsOneWidget);
    expect(find.text('Enter your registered email address to receive a 6-digit OTP password reset code.'), findsOneWidget);
  });
}
