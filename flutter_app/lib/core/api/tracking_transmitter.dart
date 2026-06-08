import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'api_client.dart';

class TrackingTransmitter {
  static TrackingTransmitter? _active;
  static TrackingTransmitter? get active => _active;

  final String uuid;
  final void Function(String message) onError;
  final void Function(Position position) onPing;
  final Duration interval;

  Timer? _timer;
  bool _busy = false;
  Position? _lastPosition;

  TrackingTransmitter({
    required this.uuid,
    required this.onError,
    required this.onPing,
    this.interval = const Duration(seconds: 30),
  });

  Position? get lastPosition => _lastPosition;
  bool get isRunning => _timer != null;

  static Future<bool> ensurePermission() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) return false;
    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
    return perm == LocationPermission.always || perm == LocationPermission.whileInUse;
  }

  Future<void> start() async {
    if (_active != null && _active!.uuid != uuid) {
      _active!.stop();
    }
    if (_timer != null) return;
    _active = this;
    await _send();
    _timer = Timer.periodic(interval, (_) => _send());
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    if (_active == this) _active = null;
  }

  Future<void> _send({String? message}) async {
    if (_busy) return;
    _busy = true;
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 20),
        ),
      );
      _lastPosition = pos;
      onPing(pos);
      await ApiClient.instance.dio.post('/bookings/$uuid/track', data: {
        'lat': pos.latitude,
        'lng': pos.longitude,
        if (message != null) 'status_message': message,
      });
    } catch (e) {
      onError(e.toString());
    } finally {
      _busy = false;
    }
  }

  Future<void> sendNow({String? message}) => _send(message: message);
}
