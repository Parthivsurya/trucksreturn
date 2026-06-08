import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/shipper_api.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';
import 'post_load_screen.dart';

class ShipperHomeTab extends StatefulWidget {
  const ShipperHomeTab({super.key});

  @override
  State<ShipperHomeTab> createState() => _ShipperHomeTabState();
}

class _ShipperHomeTabState extends State<ShipperHomeTab> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final s = await ShipperApi.getStats();
    if (!mounted) return;
    setState(() {
      _stats = s;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            Row(children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Hello,', style: TextStyle(color: AppTheme.muted, fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(user?.name ?? '',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.notifications_none_rounded, color: AppTheme.primary),
              ),
            ]),
            const SizedBox(height: 24),
            if (_loading)
              const Center(child: Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(color: AppTheme.primary),
              ))
            else
              Row(children: [
                Expanded(child: _Stat(
                  icon: Icons.inventory_2_rounded, label: 'Total loads',
                  value: _stats?['totalLoads']?.toString() ?? '0',
                )),
                const SizedBox(width: 10),
                Expanded(child: _Stat(
                  icon: Icons.fiber_manual_record_rounded, label: 'Active',
                  value: _stats?['activeLoads']?.toString() ?? '0',
                )),
                const SizedBox(width: 10),
                Expanded(child: _Stat(
                  icon: Icons.payments_rounded, label: 'Spent',
                  value: _stats?['totalSpent'] is num ? money.format(_stats!['totalSpent']) : '₹0',
                )),
              ]),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppTheme.primary, AppTheme.primaryDark],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 32),
                  const SizedBox(height: 12),
                  const Text('Need to ship something?',
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  const Text('Post a load and get matched with available trucks on return routes.',
                      style: TextStyle(color: Colors.white70, fontSize: 14)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.primary,
                      ),
                      onPressed: () async {
                        final ok = await Navigator.push<bool>(context,
                            MaterialPageRoute(builder: (_) => const PostLoadScreen()));
                        if (ok == true && mounted) _load();
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_rounded), SizedBox(width: 6),
                          Text('Post a load', style: TextStyle(fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String label, value;
  const _Stat({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 18, color: AppTheme.primary),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.muted)),
      ]),
    );
  }
}
