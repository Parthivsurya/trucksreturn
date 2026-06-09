import 'package:dio/dio.dart';
import 'api_client.dart';

class UploadApi {
  static final _dio = ApiClient.instance.dio;

  static Future<Map<String, dynamic>> uploadDocument({
    required String filePath,
    required String docType,
  }) async {
    final form = FormData.fromMap({
      'doc_type': docType,
      'file': await MultipartFile.fromFile(filePath),
    });
    final r = await _dio.post(
      '/documents',
      data: form,
      options: Options(contentType: 'multipart/form-data'),
    );
    if (r.statusCode == 200 || r.statusCode == 201) {
      return Map<String, dynamic>.from(r.data ?? {});
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }

  static Future<List<Map<String, dynamic>>> getMyDocuments() async {
    final r = await _dio.get('/documents/mine');
    if (r.statusCode == 200 && r.data is Map && r.data['documents'] is List) {
      return (r.data['documents'] as List)
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
    }
    return const [];
  }

  static Future<String> submitForVerification() async {
    final r = await _dio.post('/drivers/submit-verification');
    if (r.statusCode == 200 || r.statusCode == 201) {
      return r.data is Map ? (r.data['message']?.toString() ?? 'Submitted') : 'Submitted';
    }
    throw ApiException(extractResponseError(r), r.statusCode);
  }
}
