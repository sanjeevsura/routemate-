import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:routemate/core/localization/app_localizations.dart';

void main() {
  group('Global Localization Architecture Tests', () {
    test('All 5 required languages are configured and supported', () {
      final codes = AppLocalizations.supportedLocales.map((l) => l.languageCode).toList();
      expect(codes, containsAll(['en', 'ta', 'te', 'ml', 'hi']));
      expect(codes.length, 5);
    });

    test('English dictionary contains essential navigation and safety keys', () {
      final enLoc = AppLocalizations(const Locale('en'));
      expect(enLoc.appName, 'RouteMate');
      expect(enLoc.navigate, 'Navigate');
      expect(enLoc.findGuide, 'Find a Guide');
      expect(enLoc.nearbyEssentials, 'Nearby Essentials');
      expect(enLoc.emergencySos, 'Emergency SOS');
      expect(enLoc.adminOverview, 'Admin Command Center');
    });

    test('Tamil (தமிழ்) dictionary loads native localized strings', () {
      final taLoc = AppLocalizations(const Locale('ta'));
      expect(taLoc.appName, 'ரூட்மேட்');
      expect(taLoc.navigate, 'வழிசெலுத்துக');
      expect(taLoc.findGuide, 'வழிகாட்டியைத் தேடுங்கள்');
      expect(taLoc.language, 'மொழி');
      expect(taLoc.trips, 'பயணங்கள்');
    });

    test('Telugu (తెలుగు) dictionary loads native localized strings', () {
      final teLoc = AppLocalizations(const Locale('te'));
      expect(teLoc.appName, 'రూట్‌మేట్');
      expect(teLoc.navigate, 'నావిగేట్ చేయండి');
      expect(teLoc.findGuide, 'గైడ్‌ను కనుగొనండి');
      expect(teLoc.language, 'భాష');
    });

    test('Malayalam (മലയാളം) dictionary loads native localized strings', () {
      final mlLoc = AppLocalizations(const Locale('ml'));
      expect(mlLoc.appName, 'റൂട്ട്മേറ്റ്');
      expect(mlLoc.navigate, 'നാവിഗേറ്റ് ചെയ്യുക');
      expect(mlLoc.findGuide, 'ഗൈഡിനെ കണ്ടെത്തുക');
      expect(mlLoc.language, 'ഭാഷ');
    });

    test('Hindi (हिन्दी) dictionary loads native localized strings', () {
      final hiLoc = AppLocalizations(const Locale('hi'));
      expect(hiLoc.appName, 'रूटमेट');
      expect(hiLoc.navigate, 'नेविगेट करें');
      expect(hiLoc.findGuide, 'गाइड खोजें');
      expect(hiLoc.language, 'भाषा');
    });

    test('Registration keys exist in all 5 languages', () {
      for (final code in ['en', 'ta', 'te', 'ml', 'hi']) {
        final loc = AppLocalizations(Locale(code));
        expect(loc.createAccount.isNotEmpty, true);
        expect(loc.fullName.isNotEmpty, true);
        expect(loc.email.isNotEmpty, true);
        expect(loc.password.isNotEmpty, true);
        expect(loc.phoneNumber.isNotEmpty, true);
        expect(loc.guideProfileInfo.isNotEmpty, true);
        expect(loc.submitGuideApplication.isNotEmpty, true);
        expect(loc.emergencyContactSetup.isNotEmpty, true);
      }
    });
  });
}
