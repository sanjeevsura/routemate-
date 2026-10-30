import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:routemate/core/localization/app_localizations.dart';
import 'package:routemate/features/auth/screens/welcome_screen.dart';

void main() {
  testWidgets('WelcomeScreen renders RouteMate branding and role buttons', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          locale: Locale('en'),
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: WelcomeScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('RouteMate'), findsOneWidget);
    expect(find.text('Get Started as Traveller'), findsOneWidget);
    expect(find.text('Log In'), findsOneWidget);
  });
}
