import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'https://api.trucksreturn.com/api';
  static const _storage = FlutterSecureStorage();

  late final Dio _dio;
  static final ApiClient instance = ApiClient._();

  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
      validateStatus: (s) => s != null && s < 500,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (e, handler) {
        if (e.response?.statusCode == 401) {
          _storage.delete(key: 'access_token');
        }
        handler.next(e);
      },
    ));
  }

  Dio get dio => _dio;

  Future<void> saveToken(String token) => _storage.write(key: 'access_token', value: token);
  Future<String?> getToken() => _storage.read(key: 'access_token');
  Future<void> clearToken() => _storage.delete(key: 'access_token');
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);
  @override
  String toString() => message;
}

String extractError(DioException e) {
  final data = e.response?.data;
  if (data is Map) {
    return data['message']?.toString() ?? data['error']?.toString() ?? 'Request failed';
  }
  return e.message ?? 'Network error';
}
