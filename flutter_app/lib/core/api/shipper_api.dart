import 'package:dio/dio.dart';
import 'api_client.dart';

class ShipperApi {
  static final _dio = ApiClient.instance.dio;

  static Future<Map<String, dynamic>> createLoad({
    required double pickupLat,
    required double pickupLng,
    required double deliveryLat,
    required double deliveryLng,
    required String pickupCity,
    required String deliveryCity,
    required String pickupAddress,
    String? deliveryAddress,
    required String cargoType,
    required double weightTons,
    required double offeredPrice,
    String? description,
    String? handlingInstructions,
    String? timeline,
  }) async {
    final r = await _dio.post('/loads', data: {
      'pickup_lat': pickupLat,
      'pickup_lng': pickupLng,
      'delivery_lat': deliveryLat,
      'delivery_lng': deliveryLng,
      'pickup_city': pickupCity,
      'delivery_city': deliveryCity,
      'pickup_address': pickupAddress,
      if (deliveryAddress != null && deliveryAddress.isNotEmpty) 'delivery_address': deliveryAddress,
      'cargo_type': cargoType,
      'weight_tons': weightTons,
      'offered_price': offeredPrice,
      if (description != null && description.isNotEmpty) 'description': description,
      if (handlingInstructions != null && handlingInstructions.isNotEmpty) 'handling_instructions': handlingInstructions,
      if (timeline != null && timeline.isNotEmpty) 'timeline': timeline,
    });
    if (r.statusCode == 200 || r.statusCode == 201) {
      return Map<String, dynamic>.from(r.data['load'] ?? r.data);
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<List<Map<String, dynamic>>> getMyLoads() async {
    final r = await _dio.get('/loads/mine');
    if (r.statusCode == 200 && r.data is Map && r.data['loads'] is List) {
      return (r.data['loads'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return const [];
  }

  static Future<List<Map<String, dynamic>>> getLoadMatches(String uuid) async {
    final r = await _dio.get('/loads/$uuid/matches');
    if (r.statusCode == 200 && r.data is Map && r.data['matches'] is List) {
      return (r.data['matches'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return const [];
  }

  static Future<void> connectDriver(String loadUuid, int driverId) async {
    final r = await _dio.post('/loads/$loadUuid/connect-driver',
        data: {'driver_id': driverId});
    if (r.statusCode != 200 && r.statusCode != 201) {
      throw ApiException(extractResponseError(r), r.statusCode);
    }
  }

  static Future<List<Map<String, dynamic>>> getBookings() async {
    final r = await _dio.get('/bookings/shipper');
    if (r.statusCode == 200 && r.data is Map && r.data['bookings'] is List) {
      return (r.data['bookings'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return const [];
  }

  static Future<Map<String, dynamic>?> getStats() async {
    try {
      final r = await _dio.get('/loads/shipper-stats');
      if (r.statusCode == 200 && r.data is Map && r.data['stats'] != null) {
        return Map<String, dynamic>.from(r.data['stats']);
      }
    } on DioException { /* ignore */ }
    return null;
  }
}
