import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

class City {
  final String name;
  final String state;
  final double lat;
  final double lng;
  const City({required this.name, required this.state, required this.lat, required this.lng});

  String get label => '$name, $state';

  factory City.fromJson(Map<String, dynamic> j) => City(
        name: j['name'] as String,
        state: j['state'] as String,
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
      );
}

class CityRepo {
  static final CityRepo instance = CityRepo._();
  CityRepo._();

  List<City> _all = const [];
  bool _loaded = false;

  Future<void> load() async {
    if (_loaded) return;
    final raw = await rootBundle.loadString('assets/cities.json');
    final list = json.decode(raw) as List;
    _all = list.map((e) => City.fromJson(e as Map<String, dynamic>)).toList();
    _loaded = true;
  }

  List<City> get all => _all;

  List<City> search(String q, {int limit = 100}) {
    final s = q.trim().toLowerCase();
    if (s.isEmpty) return _all.take(limit).toList();
    final starts = <City>[];
    final contains = <City>[];
    for (final c in _all) {
      final n = c.name.toLowerCase();
      if (n.startsWith(s)) {
        starts.add(c);
      } else if (n.contains(s) || c.state.toLowerCase().contains(s)) {
        contains.add(c);
      }
      if (starts.length >= limit) break;
    }
    final out = [...starts, ...contains];
    return out.length > limit ? out.sublist(0, limit) : out;
  }
}
