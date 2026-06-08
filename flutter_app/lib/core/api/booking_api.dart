import 'package:dio/dio.dart';
import 'api_client.dart';

class BookingApi {
  static final _dio = ApiClient.instance.dio;

  static Future<Map<String, dynamic>> create({
    required int loadId,
    required double agreedPrice,
  }) async {
    final r = await _dio.post('/bookings', data: {
      'load_id': loadId,
      'agreed_price': agreedPrice,
    });
    if (r.statusCode == 200 || r.statusCode == 201) {
      if (r.data is Map && r.data['booking'] != null) {
        return Map<String, dynamic>.from(r.data['booking']);
      }
      return Map<String, dynamic>.from(r.data ?? {});
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<Map<String, dynamic>?> getByUuid(String uuid) async {
    try {
      final r = await _dio.get('/bookings/$uuid');
      if (r.statusCode == 200 && r.data is Map) {
        final m = Map<String, dynamic>.from(r.data);
        return Map<String, dynamic>.from(m['booking'] ?? m);
      }
    } on DioException { /* ignore */ }
    return null;
  }

  static Future<void> updateStatus(String uuid, String status) async {
    final r = await _dio.put('/bookings/$uuid/status', data: {'status': status});
    if (r.statusCode != 200) throw ApiException(extractResponseError(r), r.statusCode);
  }
}
