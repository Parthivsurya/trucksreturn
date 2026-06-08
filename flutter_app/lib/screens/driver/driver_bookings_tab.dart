import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/driver_api.dart';
import '../../core/theme.dart';
import '../booking_detail_screen.dart';

class DriverBookingsTab extends StatefulWidget {
  const DriverBookingsTab({super.key});

  @override
  State<DriverBookingsTab> createState() => _DriverBookingsTabState();
}

class _DriverBookingsTabState extends State<DriverBookingsTab> {
  List<Map<String, dynamic>> _bookings = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final list = await DriverApi.getBookings();
    if (!mounted) return;
    setState(() {
      _bookings = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text('Your bookings',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _load,
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : _bookings.isEmpty
                    ? ListView(children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Column(children: [
                              Icon(Icons.assignment_outlined, size: 64, color: AppTheme.muted),
                              SizedBox(height: 12),
                              Text('No bookings yet',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                              SizedBox(height: 6),
                              Text('Accept a load to get started',
                                  style: TextStyle(color: AppTheme.muted)),
                            ]),
                          ),
                        ),
                      ])
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                        itemCount: _bookings.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (_, i) {
                          final b = _bookings[i];
                          return _BookingCard(
                            b: b,
                            onTap: () async {
                              final uuid = b['uuid']?.toString();
                              if (uuid == null) return;
                              await Navigator.push(context,
                                  MaterialPageRoute(builder: (_) => BookingDetailScreen(uuid: uuid)));
                              if (mounted) _load();
                            },
                          );
                        },
                      ),
          ),
        ),
      ]),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> b;
  final VoidCallback onTap;
  const _BookingCard({required this.b, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final price = b['agreed_price'] is num ? money.format(b['agreed_price']) : '—';
    final status = b['status']?.toString() ?? 'pending';
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
          const SizedBox(height: 10),
          Row(children: [
            const Icon(Icons.my_location_rounded, size: 15, color: AppTheme.success),
            const SizedBox(width: 6),
            Expanded(
              child: Text(b['pickup_city']?.toString() ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
            const Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.muted),
            const SizedBox(width: 6),
            Expanded(
              child: Text(b['delivery_city']?.toString() ?? '',
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
            ),
          ]),
          if (b['shipper_name'] != null) ...[
            const SizedBox(height: 10),
            Row(children: [
              const Icon(Icons.person_outline_rounded, size: 14, color: AppTheme.muted),
              const SizedBox(width: 5),
              Text(b['shipper_name'].toString(),
                  style: const TextStyle(fontSize: 13, color: AppTheme.muted)),
            ]),
          ],
        ],
      ),
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
      'confirmed' => (AppTheme.accent, 'CONFIRMED'),
      'picked_up' => (AppTheme.warning, 'PICKED UP'),
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
