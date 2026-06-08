import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'api_client.dart';

class TrackEvent {
  final String type;
  final Map<String, dynamic> data;
  TrackEvent(this.type, this.data);
}

class TrackingService {
  final String uuid;
  final void Function(TrackEvent event) onEvent;
  final void Function(bool live) onConnection;

  HttpClient? _client;
  HttpClientRequest? _request;
  StreamSubscription? _sub;
  Timer? _pollTimer;
  bool _disposed = false;
  bool _live = false;

  TrackingService({required this.uuid, required this.onEvent, required this.onConnection});

  Future<void> start() async {
    await _connectSse();
  }

  Future<void> _connectSse() async {
    if (_disposed) return;
    try {
      final token = await ApiClient.instance.getToken();
      _client = HttpClient();
      final uri = Uri.parse('${ApiClient.baseUrl}/bookings/$uuid/track/stream');
      _request = await _client!.getUrl(uri);
      _request!.headers.set('Accept', 'text/event-stream');
      _request!.headers.set('Cache-Control', 'no-cache');
      if (token != null) _request!.headers.set('Authorization', 'Bearer $token');
      final response = await _request!.close();
      if (response.statusCode != 200) {
        throw HttpException('SSE status ${response.statusCode}');
      }
      _live = true;
      onConnection(true);

      String? currentEvent;
      final buffer = StringBuffer();

      _sub = response
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen((line) {
        if (_disposed) return;
        if (line.isEmpty) {
          if (currentEvent != null && buffer.isNotEmpty) {
            final raw = buffer.toString();
            try {
              final decoded = jsonDecode(raw);
              if (decoded is Map) {
                onEvent(TrackEvent(currentEvent!, Map<String, dynamic>.from(decoded)));
              }
            } catch (_) {}
          }
          currentEvent = null;
          buffer.clear();
          return;
        }
        if (line.startsWith(':')) return;
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          buffer.write(line.substring(5).trim());
        }
      }, onError: (_) => _fallbackToPolling(), onDone: () => _fallbackToPolling(), cancelOnError: true);
    } catch (_) {
      _fallbackToPolling();
    }
  }

  void _fallbackToPolling() {
    if (_disposed) return;
    if (_live) {
      _live = false;
      onConnection(false);
    }
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) => _pollOnce());
    _pollOnce();
  }

  Future<void> _pollOnce() async {
    if (_disposed) return;
    try {
      final r = await ApiClient.instance.dio.get('/bookings/$uuid');
      if (_disposed) return;
      if (r.statusCode == 200 && r.data is Map) {
        final m = Map<String, dynamic>.from(r.data);
        final booking = m['booking'];
        if (booking is Map) {
          onEvent(TrackEvent('snapshot', {
            'booking': Map<String, dynamic>.from(booking),
            'tracking': (m['tracking'] is List)
                ? (m['tracking'] as List).map((e) => Map<String, dynamic>.from(e as Map)).toList()
                : <Map<String, dynamic>>[],
          }));
        }
      }
    } catch (_) {}
  }

  void dispose() {
    _disposed = true;
    _pollTimer?.cancel();
    _sub?.cancel();
    try { _request?.abort(); } catch (_) {}
    try { _client?.close(force: true); } catch (_) {}
  }
}
