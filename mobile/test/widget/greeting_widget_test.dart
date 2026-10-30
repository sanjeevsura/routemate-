import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:routemate/core/localization/app_localizations.dart';
import 'package:routemate/features/auth/auth_state.dart';
import 'package:routemate/features/profile/screens/profile_screen.dart';

void main() {
  testWidgets('ProfileScreen displays real user full_name and not placeholder User', (tester) async {
    final container = ProviderContainer(
      overrides: [
        authProvider.overrideWith((ref) => MockAuthNotifier(
          const AuthState(
            status: AuthStatus.authenticated,
            isAuthenticated: true,
            role: 'TRAVELLER',
            userProfile: {
              'full_name': 'Alex Morgan',
              'email': 'alex@example.com',
              'role': 'TRAVELLER',
            },
          ),
        )),
      ],
    );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          locale: Locale('en'),
          localizationsDelegates: [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: ProfileScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify user's actual name is displayed
    expect(find.text('Alex Morgan'), findsOneWidget);
    // Verify placeholder 'User' is NOT displayed
    expect(find.text('User'), findsNothing);
    // Verify server settings tile is NOT present
    expect(find.text('Server Connection Settings'), findsNothing);
  });
}

class MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  MockAuthNotifier(super.state);

  @override
  Future<void> restoreSession() async {}

  @override
  Future<void> login(String email, String password) async {}

  @override
  Future<void> register(Map<String, dynamic> params) async {}

  @override
  Future<void> resetPassword(String email) async {}

  @override
  Future<void> verifyOtpAndResetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {}

  @override
  Future<void> logout() async {}
}
