import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/driver_api.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/booking_sheet.dart';

class DriverMatchesTab extends StatefulWidget {
  const DriverMatchesTab({super.key});

  @override
  State<DriverMatchesTab> createState() => _DriverMatchesTabState();
}

class _DriverMatchesTabState extends State<DriverMatchesTab> {
  List<Map<String, dynamic>> _matches = const [];
  String? _info;
  String? _error;
  bool _loading = true;
  double _radius = 50;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _accept(Map<String, dynamic> match) async {
    final ok = await AcceptLoadSheet.show(context, match);
    if (ok == true && mounted) {
      showSuccess(context, 'Booking confirmed. See it in Bookings tab.');
      _load();
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
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
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _matches = const [];
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Row(children: [
            const Expanded(
              child: Text('Available loads',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            ),
            IconButton(
              icon: const Icon(Icons.refresh_rounded),
              onPressed: _load,
            ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            const Icon(Icons.tune_rounded, size: 18, color: AppTheme.muted),
            const SizedBox(width: 8),
            const Text('Corridor radius', style: TextStyle(color: AppTheme.muted, fontSize: 13)),
            const Spacer(),
            Text('${_radius.toInt()} km', style: const TextStyle(fontWeight: FontWeight.w700)),
          ]),
        ),
        Slider(
          value: _radius,
          min: 20, max: 150, divisions: 13,
          activeColor: AppTheme.primary,
          onChanged: (v) => setState(() => _radius = v),
          onChangeEnd: (_) => _load(),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _error != null
                    ? _EmptyState(icon: Icons.warning_amber_rounded, title: 'Cannot load', subtitle: _error!)
                    : _matches.isEmpty
                        ? _EmptyState(
                            icon: Icons.inbox_rounded,
                            title: 'No matches yet',
                            subtitle: _info ?? 'No loads on your corridor right now.',
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
                            itemCount: _matches.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 12),
                            itemBuilder: (_, i) => _MatchCard(
                              m: _matches[i],
                              onAccept: () => _accept(_matches[i]),
                            ),
                          ),
          ),
        ),
      ]),
    );
  }
}

class _MatchCard extends StatelessWidget {
  final Map<String, dynamic> m;
  final VoidCallback onAccept;
  const _MatchCard({required this.m, required this.onAccept});

  @override
  Widget build(BuildContext context) {
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final price = m['offered_price'] is num ? money.format(m['offered_price']) : '—';
    final isInter = m['is_intermediate'] == true;
    final progress = m['route_progress_pct'];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            if (isInter)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('ON-ROUTE${progress != null ? ' • ${progress.toString()}%' : ''}',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.accent)),
              ),
            const Spacer(),
            Text(price, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primary)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            const Icon(Icons.my_location_rounded, size: 16, color: AppTheme.success),
            const SizedBox(width: 6),
            Expanded(
              child: Text(m['pickup_city']?.toString() ?? '',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ]),
          const Padding(
            padding: EdgeInsets.only(left: 7),
            child: SizedBox(height: 14, child: VerticalDivider(width: 1, thickness: 1, color: AppTheme.border)),
          ),
          Row(children: [
            const Icon(Icons.location_on_rounded, size: 16, color: AppTheme.danger),
            const SizedBox(width: 6),
            Expanded(
              child: Text(m['delivery_city']?.toString() ?? '',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ]),
          const SizedBox(height: 12),
          Wrap(spacing: 6, runSpacing: 6, children: [
            if (m['weight_tons'] != null) _Chip(icon: Icons.scale_rounded, text: '${m['weight_tons']} t'),
            if (m['cargo_type'] != null) _Chip(icon: Icons.inventory_2_outlined, text: m['cargo_type'].toString()),
            if (m['detour_pct'] is num)
              _Chip(icon: Icons.route_rounded, text: '+${(m['detour_pct'] as num).toStringAsFixed(0)}% detour'),
          ]),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onAccept,
              child: const Text('Accept load'),
            ),
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Chip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: AppTheme.bg, borderRadius: BorderRadius.circular(20)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: AppTheme.muted),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
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
