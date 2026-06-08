import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/shipper_api.dart';
import '../../core/theme.dart';
import 'post_load_screen.dart';

class ShipperLoadsTab extends StatefulWidget {
  const ShipperLoadsTab({super.key});

  @override
  State<ShipperLoadsTab> createState() => _ShipperLoadsTabState();
}

class _ShipperLoadsTabState extends State<ShipperLoadsTab> {
  List<Map<String, dynamic>> _loads = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final l = await ShipperApi.getMyLoads();
    if (!mounted) return;
    setState(() {
      _loads = l;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Row(children: [
              const Expanded(
                child: Text('My loads',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              ),
              IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load),
            ]),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _load,
              child: _loading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                  : _loads.isEmpty
                      ? _empty()
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                          itemCount: _loads.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (_, i) => _LoadCard(load: _loads[i]),
                        ),
            ),
          ),
        ]),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final ok = await Navigator.push<bool>(context,
              MaterialPageRoute(builder: (_) => const PostLoadScreen()));
          if (ok == true && mounted) _load();
        },
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Post load'),
      ),
    );
  }

  Widget _empty() {
    return ListView(children: [
      SizedBox(height: MediaQuery.of(context).size.height * 0.15),
      const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(children: [
            Icon(Icons.inventory_2_outlined, size: 64, color: AppTheme.muted),
            SizedBox(height: 12),
            Text('No loads posted yet',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            SizedBox(height: 6),
            Text('Tap the + button to post your first load',
                style: TextStyle(color: AppTheme.muted)),
          ]),
        ),
      ),
    ]);
  }
}

class _LoadCard extends StatelessWidget {
  final Map<String, dynamic> load;
  const _LoadCard({required this.load});

  @override
  Widget build(BuildContext context) {
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final price = load['offered_price'] is num ? money.format(load['offered_price']) : '—';
    final status = load['status']?.toString() ?? 'open';
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
            _StatusBadge(status: status),
            const Spacer(),
            Text(price,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppTheme.primary)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            const Icon(Icons.my_location_rounded, size: 15, color: AppTheme.success),
            const SizedBox(width: 6),
            Expanded(
              child: Text(load['pickup_city']?.toString() ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
            const Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.muted),
            const SizedBox(width: 6),
            Expanded(
              child: Text(load['delivery_city']?.toString() ?? '',
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ]),
          if (load['cargo_type'] != null || load['weight_tons'] != null) ...[
            const SizedBox(height: 10),
            Wrap(spacing: 6, children: [
              if (load['cargo_type'] != null)
                _Chip(icon: Icons.inventory_2_outlined, text: load['cargo_type'].toString()),
              if (load['weight_tons'] != null)
                _Chip(icon: Icons.scale_rounded, text: '${load['weight_tons']} t'),
            ]),
          ],
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      'open' => (AppTheme.accent, 'OPEN'),
      'booked' => (AppTheme.warning, 'BOOKED'),
      'in_transit' => (AppTheme.primary, 'IN TRANSIT'),
      'delivered' => (AppTheme.success, 'DELIVERED'),
      'cancelled' => (AppTheme.danger, 'CANCELLED'),
      _ => (AppTheme.muted, status.toUpperCase()),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
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
