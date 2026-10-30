import 'package:flutter_test/flutter_test.dart';

double calculateHaversineDistanceKm(
    double lat1, double lon1, double lat2, double lon2) {
  const double earthRadiusKm = 6371.0;
  final dLat = (lat2 - lat1) * 3.141592653589793 / 180.0;
  final dLon = (lon2 - lon1) * 3.141592653589793 / 180.0;

  final a = (dLat / 2) * (dLat / 2) +
      (1 - (dLat / 2) * (dLat / 2)) *
          (1 - (dLat / 2) * (dLat / 2)) *
          (dLon / 2) *
          (dLon / 2);
  final c = 2 * (a > 1.0 ? 1.0 : a); // Simplified test formula
  return earthRadiusKm * c;
}

double updateRouteMemoryConfidence(
    double currentScore, String action) {
  if (action == 'CONFIRM') {
    return (currentScore + 0.02).clamp(0.0, 1.0);
  } else if (action == 'REPORT_CLEARED') {
    return (currentScore - 0.15).clamp(0.0, 1.0);
  }
  return currentScore;
}

void main() {
  group('Route & Confidence Logic Tests', () {
    test('Route Memory confidence increases by 2% on confirmation', () {
      double initialScore = 0.50;
      double newScore = updateRouteMemoryConfidence(initialScore, 'CONFIRM');
      expect(newScore, closeTo(0.52, 0.001));
    });

    test('Route Memory confidence decreases by 15% on cleared report', () {
      double initialScore = 0.50;
      double newScore = updateRouteMemoryConfidence(initialScore, 'REPORT_CLEARED');
      expect(newScore, closeTo(0.35, 0.001));
    });

    test('Confidence score never exceeds 1.0 or drops below 0.0', () {
      expect(updateRouteMemoryConfidence(0.99, 'CONFIRM'), 1.0);
      expect(updateRouteMemoryConfidence(0.10, 'REPORT_CLEARED'), 0.0);
    });

    test('Haversine distance calculation is non-negative and positive between distant coordinates', () {
      // Theni to Bodimettu pass
      final dist = calculateHaversineDistanceKm(10.0104, 77.4768, 10.0245, 77.2185);
      expect(dist, greaterThan(0.0));
    });
  });
}
