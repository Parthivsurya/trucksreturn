import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/driver_api.dart';
import '../../core/theme.dart';
import 'driver_load_detail_screen.dart';

class DriverMatchesTab extends StatefulWidget {
  const DriverMatchesTab({super.key});

  @override
  State<DriverMatchesTab> createState() => _DriverMatchesTabState();
}

class _DriverMatchesTabState extends State<DriverMatchesTab> {
  List<Map<String, dynamic>> _matches = [];
  Map<String, dynamic>? _availability;
  Map<String, dynamic>? _truck;
  
  String? _info;
  String? _error;
  bool _loading = true;
  double _radius = 50;
  String _selectedFilter = 'best'; // 'best', 'pay', 'detour', 'pickup'

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      _truck = await DriverApi.getTruck();
      _availability = await DriverApi.getAvailability();
      
      if (_availability == null) {
        setState(() {
          _matches = [];
          _loading = false;
          _info = 'Post your return route first to find matching loads.';
        });
        return;
      }

      final data = await DriverApi.getMatches(radiusKm: _radius);
      if (!mounted) return;
      
      final list = (data['matches'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ?? [];
              
      setState(() {
        _matches = list;
        _info = data['message']?.toString();
        _error = null;
        _loading = false;
      });
      _sortMatches();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _matches = [];
        _error = e.toString();
        _loading = false;
      });
    }
  }

  void _sortMatches() {
    setState(() {
      if (_selectedFilter == 'best') {
        _matches.sort((a, b) => ((a['match_score'] as num?)?.toDouble() ?? 0.0)
            .compareTo((b['match_score'] as num?)?.toDouble() ?? 0.0));
      } else if (_selectedFilter == 'pay') {
        _matches.sort((a, b) => ((b['offered_price'] as num?)?.toDouble() ?? 0.0)
            .compareTo((a['offered_price'] as num?)?.toDouble() ?? 0.0));
      } else if (_selectedFilter == 'detour') {
        _matches.sort((a, b) => ((a['detour_percent'] as num?)?.toDouble() ?? 0.0)
            .compareTo((b['detour_percent'] as num?)?.toDouble() ?? 0.0));
      } else if (_selectedFilter == 'pickup') {
        _matches.sort((a, b) => ((a['pickup_distance_km'] as num?)?.toDouble() ?? 0.0)
            .compareTo((b['pickup_distance_km'] as num?)?.toDouble() ?? 0.0));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasActiveRoute = _availability != null;
    final startCity = _availability?['current_city']?.toString().toUpperCase() ?? 'ORIGIN';
    final destCity = _availability?['destination_city']?.toString().toUpperCase() ?? 'DESTINATION';

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        automaticallyImplyLeading: false,
        title: const Text(
          'Loads on corridor',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.text),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.text),
            onPressed: _load,
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: AppTheme.text),
            onPressed: () {
              // Show radius adjustment sheet
              showModalBottomSheet(
                context: context,
                backgroundColor: Colors.white,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                ),
                builder: (context) {
                  return StatefulBuilder(
                    builder: (context, setSheetState) {
                      return Padding(
                        padding: const EdgeInsets.all(22.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Adjust Corridor Radius',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.text),
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'Find matching loads within this distance from your return path.',
                              style: TextStyle(color: AppTheme.muted, fontSize: 13),
                            ),
                            const SizedBox(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Radius', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('${_radius.toInt()} km', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary)),
                              ],
                            ),
                            Slider(
                              value: _radius,
                              min: 20,
                              max: 150,
                              divisions: 13,
                              activeColor: AppTheme.primary,
                              onChanged: (v) => setSheetState(() => _radius = v),
                            ),
                            const SizedBox(height: 14),
                            FilledButton(
                              onPressed: () {
                                Navigator.pop(context);
                                _load();
                              },
                              child: const Text('Apply radius'),
                            ),
                          ],
                        ),
                      );
                    },
                  );
                },
              );
            },
          ),
          const SizedBox(width: 8),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : _error != null
                ? _EmptyState(icon: Icons.warning_amber_rounded, title: 'Cannot load matches', subtitle: _error!)
                : !hasActiveRoute
                    ? _EmptyState(
                        icon: Icons.route_rounded,
                        title: 'No Active Corridor',
                        subtitle: _info ?? 'Post your return route first to find matching loads.',
                      )
                    : Column(
                        children: [
                          // Route Chip Bar
                          Container(
                            margin: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color.fromRGBO(34, 40, 49, 0.05),
                                  blurRadius: 3,
                                  offset: Offset(0, 1),
                                )
                              ],
                            ),
                            child: Row(
                              children: [
                                const CircleAvatar(radius: 3.5, backgroundColor: AppTheme.primary),
                                const SizedBox(width: 8),
                                Text(
                                  '$startCity → $destCity · 552 km', // Mock path km representation
                                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.text),
                                ),
                              ],
                            ),
                          ),

                          // Horizontal Filters Row
                          SizedBox(
                            height: 48,
                            child: ListView(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16.0),
                              children: [
                                _FilterChip(
                                  label: 'Best match',
                                  isSelected: _selectedFilter == 'best',
                                  onTap: () {
                                    setState(() => _selectedFilter = 'best');
                                    _sortMatches();
                                  },
                                ),
                                const SizedBox(width: 8),
                                _FilterChip(
                                  label: 'Highest pay',
                                  isSelected: _selectedFilter == 'pay',
                                  onTap: () {
                                    setState(() => _selectedFilter = 'pay');
                                    _sortMatches();
                                  },
                                ),
                                const SizedBox(width: 8),
                                _FilterChip(
                                  label: 'Least detour',
                                  isSelected: _selectedFilter == 'detour',
                                  onTap: () {
                                    setState(() => _selectedFilter = 'detour');
                                    _sortMatches();
                                  },
                                ),
                                const SizedBox(width: 8),
                                _FilterChip(
                                  label: 'Nearest pickup',
                                  isSelected: _selectedFilter == 'pickup',
                                  onTap: () {
                                    setState(() => _selectedFilter = 'pickup');
                                    _sortMatches();
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Loads List view
                          Expanded(
                            child: RefreshIndicator(
                              onRefresh: _load,
                              color: AppTheme.primary,
                              child: _matches.isEmpty
                                  ? _EmptyState(
                                      icon: Icons.inbox_rounded,
                                      title: 'No matched loads',
                                      subtitle: _info ?? 'No loads match your corridor parameters right now.',
                                    )
                                  : ListView.separated(
                                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                                      itemCount: _matches.length,
                                      separatorBuilder: (_, _) => const SizedBox(height: 11),
                                      itemBuilder: (context, i) {
                                        final load = _matches[i];
                                        final detour = (load['detour_percent'] as num?)?.toDouble() ?? 0.0;
                                        final progress = (load['route_progress_pct'] as num?)?.toInt() ?? 0;
                                        final price = (load['offered_price'] as num?)?.toDouble() ?? 0.0;
                                        final weight = (load['weight_tons'] as num?)?.toDouble() ?? 0.0;
                                        final rating = (load['shipper_rating'] as num?)?.toDouble() ?? 4.6;

                                        return GestureDetector(
                                          onTap: () => Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => DriverLoadDetailScreen(
                                                load: load,
                                                availability: _availability!,
                                                truck: _truck!,
                                              ),
                                            ),
                                          ).then((_) => _load),
                                          child: Container(
                                            padding: const EdgeInsets.all(15),
                                            decoration: BoxDecoration(
                                              color: AppTheme.surface,
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(color: AppTheme.border),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Expanded(
                                                      child: Column(
                                                        crossAxisAlignment: CrossAxisAlignment.start,
                                                        children: [
                                                          RichText(
                                                            text: TextSpan(
                                                              style: const TextStyle(
                                                                fontSize: 15.5,
                                                                fontWeight: FontWeight.bold,
                                                                color: AppTheme.text,
                                                                fontFamily: 'Roboto',
                                                              ),
                                                              children: [
                                                                TextSpan(text: load['pickup_city'] ?? ''),
                                                                const TextSpan(
                                                                  text: ' → ',
                                                                  style: TextStyle(color: AppTheme.muted, fontWeight: FontWeight.normal),
                                                                ),
                                                                TextSpan(text: load['delivery_city'] ?? ''),
                                                              ],
                                                            ),
                                                          ),
                                                          const SizedBox(height: 3),
                                                          Text(
                                                            '$weight t · ${load['cargo_type']} · fits your free cap',
                                                            style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                    Column(
                                                      crossAxisAlignment: CrossAxisAlignment.end,
                                                      children: [
                                                        Text(
                                                          '₹${NumberFormat('#,##,###').format(price)}',
                                                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.text),
                                                        ),
                                                        const Text('offered', style: TextStyle(fontSize: 10, color: AppTheme.muted)),
                                                      ],
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 11),
                                                Container(height: 1, color: AppTheme.border),
                                                const SizedBox(height: 11),
                                                Row(
                                                  children: [
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                      decoration: BoxDecoration(
                                                        color: AppTheme.accentWeak,
                                                        borderRadius: BorderRadius.circular(7),
                                                      ),
                                                      child: Text(
                                                        'ON ROUTE · $progress%',
                                                        style: const TextStyle(
                                                          fontSize: 10.5,
                                                          fontWeight: FontWeight.w900,
                                                          color: AppTheme.primaryDark,
                                                        ),
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    RichText(
                                                      text: TextSpan(
                                                        style: const TextStyle(fontSize: 11.5, color: AppTheme.muted, fontFamily: 'Roboto'),
                                                        children: [
                                                          const TextSpan(text: 'detour '),
                                                          TextSpan(
                                                            text: '+${detour.toStringAsFixed(0)}%',
                                                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.text),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: AppTheme.bg,
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Row(
                                                        children: [
                                                          const Icon(Icons.star_rounded, size: 12, color: AppTheme.primary),
                                                          const SizedBox(width: 2),
                                                          Text(
                                                            rating.toStringAsFixed(1),
                                                            style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppTheme.text),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                            ),
                          ),
                        ],
                      ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      onPressed: onTap,
      backgroundColor: isSelected ? AppTheme.accentWeak : AppTheme.surface,
      side: BorderSide(color: isSelected ? AppTheme.primary : AppTheme.border, width: 1.5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12.5,
          fontWeight: FontWeight.bold,
          color: isSelected ? AppTheme.primaryDark : AppTheme.ink2,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  const _EmptyState({required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.15),
        Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(icon, size: 64, color: AppTheme.muted),
                const SizedBox(height: 12),
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(subtitle, textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.muted)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
