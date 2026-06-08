import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/shipper_api.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';

class ShipperLoadDetailScreen extends StatefulWidget {
  final String uuid;
  const ShipperLoadDetailScreen({super.key, required this.uuid});

  @override
  State<ShipperLoadDetailScreen> createState() => _ShipperLoadDetailScreenState();
}

class _ShipperLoadDetailScreenState extends State<ShipperLoadDetailScreen> {
  Map<String, dynamic>? _load;
  List<Map<String, dynamic>> _drivers = const [];
  bool _loading = true;
  final Set<int> _connecting = {};
  final Set<int> _connected = {};

  @override
  void initState() {
    super.initState();
    _load1();
  }

  Future<void> _load1() async {
    setState(() => _loading = true);
    try {
      final res = await ShipperApi.getLoadMatches(widget.uuid);
      if (!mounted) return;
      setState(() {
        _load = res.load;
        _drivers = res.drivers;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      showError(context, e.toString());
    }
  }

  Future<void> _connect(int driverId, String name) async {
    setState(() => _connecting.add(driverId));
    try {
      final msg = await ShipperApi.connectDriver(widget.uuid, driverId);
      if (!mounted) return;
      setState(() {
        _connecting.remove(driverId);
        _connected.add(driverId);
      });
      showSuccess(context, msg);
    } catch (e) {
      if (!mounted) return;
      setState(() => _connecting.remove(driverId));
      showError(context, e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Load details'),
        actions: [
          IconButton(onPressed: _load1, icon: const Icon(Icons.refresh_rounded)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : RefreshIndicator(
              onRefresh: _load1,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                children: [
                  if (_load != null) _LoadCard(load: _load!, money: money),
                  const SizedBox(height: 24),
                  Row(children: [
                    const Text('Available drivers',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('${_drivers.length}',
                          style: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                    ),
                  ]),
                  const SizedBox(height: 12),
                  if (_drivers.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: const Column(children: [
                        Icon(Icons.search_off_rounded, size: 48, color: AppTheme.muted),
                        SizedBox(height: 10),
                        Text('No drivers nearby yet',
                            style: TextStyle(fontWeight: FontWeight.w700)),
                        SizedBox(height: 4),
                        Text(
                          'We will keep searching. Pull down to refresh.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppTheme.muted, fontSize: 13),
                        ),
                      ]),
                    )
                  else
                    ..._drivers.map((d) {
                      final id = (d['user_id'] is num) ? (d['user_id'] as num).toInt() : 0;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _DriverCard(
                          d: d,
                          connecting: _connecting.contains(id),
                          connected: _connected.contains(id),
                          onConnect: id == 0 ? null : () => _connect(id, d['driver_name']?.toString() ?? 'Driver'),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}

class _LoadCard extends StatelessWidget {
  final Map<String, dynamic> load;
  final NumberFormat money;
  const _LoadCard({required this.load, required this.money});

  @override
  Widget build(BuildContext context) {
    final price = load['offered_price'] is num ? money.format(load['offered_price']) : '—';
    final status = load['status']?.toString() ?? 'open';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(status.toUpperCase(),
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.accent)),
            ),
            const Spacer(),
            Text(price,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primary)),
          ]),
          const SizedBox(height: 14),
          Row(children: [
            const Icon(Icons.my_location_rounded, size: 16, color: AppTheme.success),
            const SizedBox(width: 8),
            Expanded(
              child: Text(load['pickup_city']?.toString() ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
            const Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.muted),
            const SizedBox(width: 8),
            Expanded(
              child: Text(load['delivery_city']?.toString() ?? '',
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ]),
          if (load['pickup_address'] != null) ...[
            const SizedBox(height: 8),
            Text(load['pickup_address'].toString(),
                style: const TextStyle(color: AppTheme.muted, fontSize: 12)),
          ],
          const SizedBox(height: 14),
          Wrap(spacing: 6, runSpacing: 6, children: [
            if (load['cargo_type'] != null)
              _MiniChip(icon: Icons.inventory_2_outlined, text: load['cargo_type'].toString()),
            if (load['weight_tons'] != null)
              _MiniChip(icon: Icons.scale_rounded, text: '${load['weight_tons']} t'),
          ]),
        ],
      ),
    );
  }
}

class _DriverCard extends StatelessWidget {
  final Map<String, dynamic> d;
  final bool connecting;
  final bool connected;
  final VoidCallback? onConnect;
  const _DriverCard({
    required this.d,
    required this.connecting,
    required this.connected,
    required this.onConnect,
  });

  @override
  Widget build(BuildContext context) {
    final name = d['driver_name']?.toString() ?? 'Driver';
    final truck = d['truck_type']?.toString() ?? '';
    final cap = d['capacity_tons']?.toString();
    final reg = d['registration_number']?.toString();
    final rating = (d['avg_rating'] is num) ? (d['avg_rating'] as num).toDouble() : 0.0;
    final ratingCount = (d['total_ratings'] is num) ? (d['total_ratings'] as num).toInt() : 0;
    final curCity = d['current_city']?.toString();
    final destCity = d['destination_city']?.toString();

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
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              alignment: Alignment.center,
              child: Text(
                name.isNotEmpty ? name[0].toUpperCase() : '?',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.primary),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Row(children: [
                    const Icon(Icons.star_rounded, size: 14, color: AppTheme.warning),
                    const SizedBox(width: 2),
                    Text(
                      ratingCount > 0 ? '${rating.toStringAsFixed(1)} ($ratingCount)' : 'New',
                      style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                    ),
                  ]),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 12),
          if (truck.isNotEmpty || cap != null || reg != null) ...[
            Wrap(spacing: 6, runSpacing: 6, children: [
              if (truck.isNotEmpty)
                _MiniChip(icon: Icons.local_shipping_rounded, text: truck),
              if (cap != null)
                _MiniChip(icon: Icons.scale_rounded, text: '$cap t'),
              if (reg != null && reg.isNotEmpty)
                _MiniChip(icon: Icons.confirmation_number_outlined, text: reg),
            ]),
            const SizedBox(height: 10),
          ],
          if (curCity != null || destCity != null)
            Row(children: [
              const Icon(Icons.route_rounded, size: 14, color: AppTheme.muted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${curCity ?? '—'}  →  ${destCity ?? '—'}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.muted, fontWeight: FontWeight.w600),
                ),
              ),
            ]),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: connected
                ? OutlinedButton.icon(
                    onPressed: null,
                    icon: const Icon(Icons.check_rounded, color: AppTheme.success),
                    label: const Text('Request sent', style: TextStyle(color: AppTheme.success)),
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.success),
                    ),
                  )
                : PrimaryButton(
                    label: 'Connect with driver',
                    icon: Icons.send_rounded,
                    loading: connecting,
                    onPressed: onConnect,
                  ),
          ),
        ],
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _MiniChip({required this.icon, required this.text});

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
