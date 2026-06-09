import 'package:dio/dio.dart';
import 'api_client.dart';

class DriverApi {
  static final _dio = ApiClient.instance.dio;

  static Future<Map<String, dynamic>?> getTruck() async {
    try {
      final r = await _dio.get('/drivers/truck');
      if (r.statusCode == 200 && r.data is Map && r.data['truck'] != null) {
        return Map<String, dynamic>.from(r.data['truck']);
      }
      return null;
    } on DioException { return null; }
  }

  static Future<Map<String, dynamic>> registerTruck({
    required String truckType,
    required double capacityTons,
    String? permitNumber,
    String? homeState,
    String? registrationNumber,
    String? insuranceExpiry,
  }) async {
    final r = await _dio.post('/drivers/truck', data: {
      'truck_type': truckType,
      'capacity_tons': capacityTons,
      if (permitNumber != null && permitNumber.isNotEmpty) 'permit_number': permitNumber,
      if (homeState != null && homeState.isNotEmpty) 'home_state': homeState,
      if (registrationNumber != null && registrationNumber.isNotEmpty) 'registration_number': registrationNumber,
      if (insuranceExpiry != null && insuranceExpiry.isNotEmpty) 'insurance_expiry': insuranceExpiry,
    });
    if (r.statusCode == 200 || r.statusCode == 201) {
      return Map<String, dynamic>.from(r.data['truck'] ?? r.data);
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<Map<String, dynamic>?> getAvailability() async {
    try {
      final r = await _dio.get('/drivers/availability');
      if (r.statusCode == 200 && r.data is Map) {
        final list = r.data['availability'];
        if (list is List && list.isNotEmpty) {
          final active = list.cast<Map>().firstWhere(
            (e) => e['status'] == 'active',
            orElse: () => list.first as Map,
          );
          return Map<String, dynamic>.from(active);
        }
      }
      return null;
    } on DioException { return null; }
  }

  static Future<Map<String, dynamic>> broadcastAvailability({
    required double currentLat,
    required double currentLng,
    required double destLat,
    required double destLng,
    required String currentCity,
    required String destinationCity,
    String? availableUntil,
    double? availableCapacityTons,
  }) async {
    final r = await _dio.post('/drivers/availability', data: {
      'current_lat': currentLat,
      'current_lng': currentLng,
      'dest_lat': destLat,
      'dest_lng': destLng,
      'current_city': currentCity,
      'destination_city': destinationCity,
      'available_until':? availableUntil,
      'available_capacity_tons':? availableCapacityTons,
    });
    if (r.statusCode == 200 || r.statusCode == 201) {
      return Map<String, dynamic>.from(r.data);
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<void> cancelAvailability(int id) async {
    final r = await _dio.put('/drivers/availability/$id/cancel');
    if (r.statusCode != 200) throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<Map<String, dynamic>> getMatches({double radiusKm = 50}) async {
    final r = await _dio.get('/drivers/matches', queryParameters: {'radius': radiusKm});
    if (r.statusCode == 200 && r.data is Map) return Map<String, dynamic>.from(r.data);
    if (r.statusCode == 403) {
      throw ApiException(extractResponseError(r), 403);
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<List<Map<String, dynamic>>> getBookings() async {
    final r = await _dio.get('/drivers/bookings');
    if (r.statusCode == 200 && r.data is Map && r.data['bookings'] is List) {
      return (r.data['bookings'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return const [];
  }

  static Future<Map<String, dynamic>?> getStats() async {
    try {
      final r = await _dio.get('/drivers/stats');
      if (r.statusCode == 200 && r.data is Map && r.data['stats'] != null) {
        return Map<String, dynamic>.from(r.data['stats']);
      }
    } on DioException { /* ignore */ }
    return null;
  }
}
