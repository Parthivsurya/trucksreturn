import 'package:dio/dio.dart';
import 'api_client.dart';

class LoadMatchesResult {
  final Map<String, dynamic> load;
  final List<Map<String, dynamic>> drivers;
  const LoadMatchesResult({required this.load, required this.drivers});
}

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

  static Future<LoadMatchesResult> getLoadMatches(String uuid) async {
    final r = await _dio.get('/loads/$uuid/matches');
    if (r.statusCode == 200 && r.data is Map) {
      final drivers = (r.data['drivers'] as List? ?? const [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      final load = r.data['load'] is Map
          ? Map<String, dynamic>.from(r.data['load'] as Map)
          : <String, dynamic>{};
      return LoadMatchesResult(load: load, drivers: drivers);
    }
    return const LoadMatchesResult(load: {}, drivers: []);
  }

  static Future<Map<String, dynamic>?> getLoadByUuid(String uuid) async {
    final r = await _dio.get('/loads/$uuid');
    if (r.statusCode == 200 && r.data is Map && r.data['load'] is Map) {
      return Map<String, dynamic>.from(r.data['load']);
    }
    return null;
  }

  static Future<String> connectDriver(String loadUuid, int driverId) async {
    final r = await _dio.post('/loads/$loadUuid/connect-driver',
        data: {'driver_id': driverId});
    if (r.statusCode == 200 || r.statusCode == 201) {
      return r.data is Map ? (r.data['message']?.toString() ?? 'Request sent') : 'Request sent';
    }
    throw ApiException(extractResponseError(r), r.statusCode);
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

  static Future<Map<String, dynamic>?> getBookingByUuid(String uuid) async {
    final r = await _dio.get('/bookings/$uuid');
    if (r.statusCode == 200 && r.data is Map && r.data['booking'] is Map) {
      return Map<String, dynamic>.from(r.data['booking']);
    }
    return null;
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
