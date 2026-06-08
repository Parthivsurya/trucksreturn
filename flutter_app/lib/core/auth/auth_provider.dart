import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../api/api_client.dart';

class AppUser {
  final int id;
  final String? uuid;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final bool verified;
  final Map<String, dynamic>? truck;

  AppUser({
    required this.id,
    this.uuid,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.verified = false,
    this.truck,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: (j['id'] as num).toInt(),
        uuid: j['uuid']?.toString(),
        name: j['name']?.toString() ?? '',
        email: j['email']?.toString() ?? '',
        phone: j['phone']?.toString(),
        role: j['role']?.toString() ?? 'driver',
        verified: j['verified'] == true || j['is_verified'] == true,
        truck: j['truck'] is Map ? Map<String, dynamic>.from(j['truck']) : null,
      );
}

class AuthProvider extends ChangeNotifier {
  AppUser? user;
  bool loading = true;

  bool get isAuthenticated => user != null;
  bool get isDriver => user?.role == 'driver';
  bool get isShipper => user?.role == 'shipper';

  Future<void> bootstrap() async {
    final token = await ApiClient.instance.getToken();
    if (token == null) {
      loading = false;
      notifyListeners();
      return;
    }
    try {
      final r = await ApiClient.instance.dio.get('/auth/me');
      if (r.statusCode == 200 && r.data is Map) {
        final m = Map<String, dynamic>.from(r.data);
        user = AppUser.fromJson(Map<String, dynamic>.from(m['user'] ?? m));
      } else {
        await ApiClient.instance.clearToken();
      }
    } catch (_) {
      await ApiClient.instance.clearToken();
    }
    loading = false;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    try {
      final r = await ApiClient.instance.dio.post('/auth/login', data: {
        'email': email.trim(),
        'password': password,
      });
      if (r.statusCode == 200 && r.data is Map) {
        final m = Map<String, dynamic>.from(r.data);
        final token = m['token']?.toString();
        if (token != null) await ApiClient.instance.saveToken(token);
        user = AppUser.fromJson(Map<String, dynamic>.from(m['user'] ?? m));
        notifyListeners();
        return null;
      }
      return extractResponseError(r);
    } on DioException catch (e) {
      return extractError(e);
    }
  }

  Future<String?> sendOtp(String email) async {
    try {
      final r = await ApiClient.instance.dio.post('/auth/send-otp', data: {
        'email': email.trim(),
      });
      if (r.statusCode == 200) return null;
      return extractResponseError(r);
    } on DioException catch (e) {
      return extractError(e);
    }
  }

  Future<String?> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String role,
    required String otp,
  }) async {
    try {
      final r = await ApiClient.instance.dio.post('/auth/register', data: {
        'name': name.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'password': password,
        'role': role,
        'otp': otp.trim(),
      });
      if (r.statusCode == 201 || r.statusCode == 200) {
        if (r.data is Map) {
          final m = Map<String, dynamic>.from(r.data);
          final token = m['token']?.toString();
          if (token != null) await ApiClient.instance.saveToken(token);
          if (m['user'] != null) {
            user = AppUser.fromJson(Map<String, dynamic>.from(m['user']));
          }
          notifyListeners();
        }
        return null;
      }
      return extractResponseError(r);
    } on DioException catch (e) {
      return extractError(e);
    }
  }

  Future<void> logout() async {
    try {
      await ApiClient.instance.dio.post('/auth/logout');
    } catch (_) {}
    await ApiClient.instance.clearToken();
    user = null;
    notifyListeners();
  }
}
