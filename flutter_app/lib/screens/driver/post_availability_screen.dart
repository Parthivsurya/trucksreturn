import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../core/api/driver_api.dart';
import '../../core/cities.dart';
import '../../core/theme.dart';
import '../../widgets/city_picker.dart';

class PostAvailabilityScreen extends StatefulWidget {
  const PostAvailabilityScreen({super.key});

  @override
  State<PostAvailabilityScreen> createState() => _PostAvailabilityScreenState();
}

class _PostAvailabilityScreenState extends State<PostAvailabilityScreen> {
  City? _from;
  City? _to;
  final _capacityController = TextEditingController(text: '9.0');
  
  Map<String, dynamic>? _truck;
  String _selectedCapacityType = 'ltl'; // 'full' or 'ltl'
  bool _saving = false;

  List<dynamic> _previewMatches = [];
  bool _loadingCorridor = false;

  @override
  void initState() {
    super.initState();
    _loadTruck();
    // Pre-populate with typical mockup data for demo feel
    _from = City(name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673);
    _to = City(name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946);

    // Load city repository and update corridor matches
    CityRepo.instance.load().then((_) {
      if (mounted) {
        _updateCorridorMatches();
      }
    });
  }

  Future<void> _updateCorridorMatches() async {
    final from = _from;
    final to = _to;
    if (from == null || to == null) return;

    setState(() => _loadingCorridor = true);
    try {
      double? cap;
      if (_selectedCapacityType == 'ltl') {
        cap = double.tryParse(_capacityController.text);
      }
      final res = await DriverApi.getMatches(
        preview: true,
        currentLat: from.lat,
        currentLng: from.lng,
        destLat: to.lat,
        destLng: to.lng,
        availableCapacityTons: cap,
      );
      if (mounted && _from == from && _to == to) {
        setState(() {
          _previewMatches = res['matches'] as List? ?? [];
          _loadingCorridor = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loadingCorridor = false);
      }
    }
  }

  double _haversineDistance(double lat1, double lng1, double lat2, double lng2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * math.pi / 180.0;
    final dLng = (lng2 - lng1) * math.pi / 180.0;
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180.0) *
            math.cos(lat2 * math.pi / 180.0) *
            math.sin(dLng / 2) *
            math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }

  Future<void> _loadTruck() async {
    try {
      final truck = await DriverApi.getTruck();
      if (mounted && truck != null) {
        setState(() {
          _truck = truck;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _capacityController.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    if (_from == null || _to == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pick both current and destination city'), backgroundColor: AppTheme.danger),
      );
      return;
    }
    if (_from!.name == _to!.name) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Origin and destination must differ'), backgroundColor: AppTheme.danger),
      );
      return;
    }
    
    setState(() => _saving = true);
    try {
      double? cap;
      if (_selectedCapacityType == 'ltl') {
        cap = double.tryParse(_capacityController.text);
        if (cap == null || cap <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter a valid capacity in tons'), backgroundColor: AppTheme.danger),
          );
          setState(() => _saving = false);
          return;
        }
      }
      
      await DriverApi.broadcastAvailability(
        currentLat: _from!.lat,
        currentLng: _from!.lng,
        destLat: _to!.lat,
        destLng: _to!.lng,
        currentCity: _from!.name,
        destinationCity: _to!.name,
        availableCapacityTons: cap,
      );
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Return route posted successfully!'), backgroundColor: AppTheme.success),
      );
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _swapCities() {
    setState(() {
      final temp = _from;
      _from = _to;
      _to = temp;
    });
    _updateCorridorMatches();
  }

  @override
  Widget build(BuildContext context) {
    final double totalTons = (_truck?['capacity_tons'] as num?)?.toDouble() ?? 16.0;

    // Compute dynamic waypoints
    final List<Map<String, String>> waypoints = [];
    if (_from != null && _to != null) {
      final allCities = CityRepo.instance.all;
      if (allCities.isNotEmpty) {
        final List<Map<String, dynamic>> rawPoints = [];
        for (int i = 0; i <= 10; i++) {
          final t = i / 10.0;
          final lat = _from!.lat + t * (_to!.lat - _from!.lat);
          final lng = _from!.lng + t * (_to!.lng - _from!.lng);
          
          City closestCity = _from!;
          double minDistance = double.infinity;
          for (final city in allCities) {
            final d = _haversineDistance(lat, lng, city.lat, city.lng);
            if (d < minDistance) {
              minDistance = d;
              closestCity = city;
            }
          }
          rawPoints.add({
            'city': closestCity,
            'pct': '${(t * 100).round()}%',
            'type': i == 0 ? 'start' : (i == 10 ? 'end' : 'waypoint'),
          });
        }

        // Deduplicate consecutive points
        final List<Map<String, dynamic>> uniquePoints = [];
        for (int i = 0; i < rawPoints.length; i++) {
          final p = rawPoints[i];
          final city = p['city'] as City;
          if (i == 0) {
            uniquePoints.add(p);
          } else if (i == rawPoints.length - 1) {
            if (uniquePoints.isNotEmpty && (uniquePoints.last['city'] as City).name == city.name) {
              uniquePoints[uniquePoints.length - 1]['type'] = 'end';
              uniquePoints[uniquePoints.length - 1]['pct'] = '100%';
            } else {
              uniquePoints.add(p);
            }
          } else {
            final lastCity = uniquePoints.last['city'] as City;
            if (city.name != lastCity.name && city.name != _to!.name) {
              uniquePoints.add(p);
            }
          }
        }

        // Build list with tags and counts
        for (final p in uniquePoints) {
          final city = p['city'] as City;
          final type = p['type'] as String;
          final pct = p['pct'] as String;

          String tag = '';
          if (type == 'start') {
            tag = 'Start · now';
          } else if (type == 'end') {
            tag = 'Destination';
          } else {
            if (_loadingCorridor) {
              tag = 'Checking matches...';
            } else {
              int count = 0;
              for (final load in _previewMatches) {
                final loadLat = (load['pickup_lat'] as num).toDouble();
                final loadLng = (load['pickup_lng'] as num).toDouble();
                final dist = _haversineDistance(city.lat, city.lng, loadLat, loadLng);
                if (dist <= 50.0) {
                  count++;
                }
              }
              tag = '$count load${count == 1 ? "" : "s"} within 50 km';
            }
          }

          waypoints.add({
            'city': city.name,
            'tag': tag,
            'type': type,
            'pct': pct,
          });
        }
      } else {
        waypoints.addAll([
          {'city': _from!.name, 'tag': 'Start · now', 'type': 'start', 'pct': '0%'},
          {'city': _to!.name, 'tag': 'Destination', 'type': 'end', 'pct': '100%'},
        ]);
      }
    } else {
      waypoints.addAll([
        {'city': 'Origin city', 'tag': 'Choose start location', 'type': 'start', 'pct': '0%'},
        {'city': 'Destination city', 'tag': 'Choose destination location', 'type': 'end', 'pct': '100%'},
      ]);
    }
    
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Set return route',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.text),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 14.0),
                children: [
                  // Starting location field
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Starting from',
                          style: TextStyle(fontSize: 12, color: AppTheme.muted, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 7),
                        CityField(
                          label: 'Origin city',
                          icon: Icons.gps_fixed_rounded,
                          value: _from,
                          onChanged: (c) {
                            setState(() => _from = c);
                            _updateCorridorMatches();
                          },
                        ),
                      ],
                    ),
                  ),

                  // Swap button row
                  Center(
                    child: Transform.translate(
                      offset: const Offset(0, 0),
                      child: GestureDetector(
                        onTap: _swapCities,
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: const BoxDecoration(
                            color: AppTheme.surface,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Color.fromRGBO(34, 40, 49, 0.15),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              )
                            ],
                          ),
                          child: const Icon(Icons.swap_vert_rounded, color: AppTheme.text, size: 20),
                        ),
                      ),
                    ),
                  ),

                  // Heading home location field
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Heading home to',
                          style: TextStyle(fontSize: 12, color: AppTheme.muted, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 7),
                        CityField(
                          label: 'Destination city',
                          icon: Icons.location_on_rounded,
                          value: _to,
                          onChanged: (c) {
                            setState(() => _to = c);
                            _updateCorridorMatches();
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Capacity toggles
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'How much can you carry on the way?',
                          style: TextStyle(fontSize: 12, color: AppTheme.muted, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 10),
                        // Segmented control mockup in Flutter
                        Container(
                          decoration: BoxDecoration(
                            border: Border.all(color: AppTheme.border, width: 1.5),
                            borderRadius: BorderRadius.circular(24),
                            color: AppTheme.surface,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () {
                                    setState(() => _selectedCapacityType = 'full');
                                    _updateCorridorMatches();
                                  },
                                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(22)),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: _selectedCapacityType == 'full' 
                                          ? AppTheme.accentWeak 
                                          : Colors.transparent,
                                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(22)),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'Full truck',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: _selectedCapacityType == 'full' 
                                            ? AppTheme.primaryDark 
                                            : AppTheme.ink2,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Container(color: AppTheme.border, width: 1.5, height: 42),
                              Expanded(
                                child: InkWell(
                                  onTap: () {
                                    setState(() => _selectedCapacityType = 'ltl');
                                    _updateCorridorMatches();
                                  },
                                  borderRadius: const BorderRadius.horizontal(right: Radius.circular(22)),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: _selectedCapacityType == 'ltl' 
                                          ? AppTheme.accentWeak 
                                          : Colors.transparent,
                                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(22)),
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      'Part load (LTL)',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: _selectedCapacityType == 'ltl' 
                                            ? AppTheme.primaryDark 
                                            : AppTheme.ink2,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        
                        // LTL input field (if selected LTL)
                        if (_selectedCapacityType == 'ltl') ...[
                          TextFormField(
                            controller: _capacityController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.text),
                            decoration: const InputDecoration(
                              labelText: 'Free capacity (tons)',
                              prefixIcon: Icon(Icons.scale_rounded, color: AppTheme.muted),
                            ),
                            onChanged: (_) {
                              setState(() {});
                              _updateCorridorMatches();
                            },
                          ),
                          const SizedBox(height: 10),
                        ],

                        // Capacity Note
                        RichText(
                          text: TextSpan(
                            style: const TextStyle(fontSize: 11.5, color: AppTheme.muted, fontFamily: 'Roboto', height: 1.5),
                            children: _selectedCapacityType == 'full'
                                ? [
                                    const TextSpan(text: 'Only full-truck loads. Matched for the whole '),
                                    TextSpan(
                                      text: '${totalTons.toStringAsFixed(0)} t',
                                      style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                                    ),
                                    const TextSpan(text: ' at once.'),
                                  ]
                                : [
                                    const TextSpan(text: 'You\'ll be matched for partial loads too. Declared free capacity: '),
                                    TextSpan(
                                      text: '${_capacityController.text.isNotEmpty ? _capacityController.text : "0.0"} tons',
                                      style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                                    ),
                                    TextSpan(text: ' of ${totalTons.toStringAsFixed(0)} t.'),
                                  ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 18),

                  // Corridor Preview Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16.0),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: const [
                        BoxShadow(
                          color: Color.fromRGBO(34, 40, 49, 0.08),
                          blurRadius: 3,
                          offset: Offset(0, 1),
                        )
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Corridor preview · 11 sample points',
                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink2),
                            ),
                            if (_loadingCorridor)
                              const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.0,
                                  color: AppTheme.primary,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        // Visual Stepper corridor timeline
                        _CorridorVisualPreview(
                          waypoints: waypoints,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
            
            // Footer Post button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 26),
              child: FilledButton(
                onPressed: _saving ? null : _post,
                child: _saving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                          SizedBox(width: 9),
                          Text('Go active · find loads'),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CorridorVisualPreview extends StatelessWidget {
  final List<Map<String, String>> waypoints;

  const _CorridorVisualPreview({
    required this.waypoints,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Line Rail
        Positioned(
          left: 14,
          top: 16,
          bottom: 16,
          child: Container(
            width: 3,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppTheme.primary,
                  AppTheme.primary,
                  AppTheme.muted,
                ],
                stops: [0.0, 0.7, 1.0],
              ),
            ),
          ),
        ),

        // Nodes
        Column(
          children: waypoints.map((wp) {
            final isStart = wp['type'] == 'start';
            final isEnd = wp['type'] == 'end';
            final isWaypoint = wp['type'] == 'waypoint';

            Color nodeBorderColor = AppTheme.muted;
            Color nodeBgColor = AppTheme.surface;
            Widget nodeChild = const SizedBox.shrink();

            if (isStart) {
              nodeBorderColor = AppTheme.primary;
              nodeBgColor = AppTheme.primary;
              nodeChild = const CircleAvatar(radius: 4, backgroundColor: Colors.white);
            } else if (isEnd) {
              nodeBorderColor = AppTheme.muted;
              nodeBgColor = AppTheme.surface;
              nodeChild = const Icon(Icons.flag_rounded, size: 10, color: AppTheme.muted);
            } else if (isWaypoint) {
              nodeBorderColor = AppTheme.primary;
              nodeBgColor = AppTheme.primary.withValues(alpha: 0.1);
              nodeChild = const CircleAvatar(radius: 3, backgroundColor: AppTheme.primary);
            }

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 9.0),
              child: Row(
                children: [
                  // Node Circle representation
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: nodeBgColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: nodeBorderColor, width: 3),
                    ),
                    alignment: Alignment.center,
                    child: nodeChild,
                  ),
                  const SizedBox(width: 14),
                  // Text details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          wp['city']!,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.text),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          wp['tag']!,
                          style: TextStyle(
                              fontSize: 11.5,
                              color: isWaypoint ? AppTheme.primary : AppTheme.muted,
                              fontWeight: isWaypoint ? FontWeight.w700 : FontWeight.normal),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    wp['pct']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isWaypoint ? AppTheme.primary : AppTheme.muted,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
