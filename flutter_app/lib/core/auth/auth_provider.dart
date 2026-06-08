import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../api/api_client.dart';

class AppUser {
  final int id;
  final String uuid;
  final String name;
  final String email;
  final String phone;
  final String role; // 'driver' | 'shipper'
  final bool verified;

  AppUser({
    required this.id,
    required this.uuid,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.verified = false,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: (j['id'] as num).toInt(),
        uuid: j['uuid']?.toString() ?? '',
        name: j['name']?.toString() ?? '',
        email: j['email']?.toString() ?? '',
        phone: j['phone']?.toString() ?? '',
        role: j['role']?.toString() ?? 'driver',
        verified: j['verified'] == true,
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
        user = AppUser.fromJson(Map<String, dynamic>.from(r.data['user'] ?? r.data));
      } else {
        await ApiClient.instance.clearToken();
      }
    } catch (_) {
      await ApiClient.instance.clearToken();
    }
    loading = false;
    notifyListeners();
  }

  Future<String?> login(String identifier, String password) async {
    try {
      final r = await ApiClient.instance.dio.post('/auth/login', data: {
        'identifier': identifier,
        'password': password,
      });
      if (r.statusCode == 200 && r.data is Map) {
        final token = r.data['token']?.toString() ?? r.data['accessToken']?.toString();
        if (token != null) await ApiClient.instance.saveToken(token);
        user = AppUser.fromJson(Map<String, dynamic>.from(r.data['user'] ?? r.data));
        notifyListeners();
        return null;
      }
      return r.data is Map ? (r.data['message']?.toString() ?? 'Login failed') : 'Login failed';
    } on DioException catch (e) {
      return extractError(e);
    }
  }

  Future<String?> sendOtp(String phone) async {
    try {
      final r = await ApiClient.instance.dio.post('/auth/send-otp', data: {'phone': phone});
      if (r.statusCode == 200) return null;
      return r.data is Map ? (r.data['message']?.toString() ?? 'Failed to send OTP') : 'Failed';
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
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
        'role': role,
        'otp': otp,
      });
      if (r.statusCode == 201 || r.statusCode == 200) {
        if (r.data is Map) {
          final token = r.data['token']?.toString() ?? r.data['accessToken']?.toString();
          if (token != null) await ApiClient.instance.saveToken(token);
          user = AppUser.fromJson(Map<String, dynamic>.from(r.data['user'] ?? r.data));
          notifyListeners();
        }
        return null;
      }
      return r.data is Map ? (r.data['message']?.toString() ?? 'Registration failed') : 'Failed';
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
