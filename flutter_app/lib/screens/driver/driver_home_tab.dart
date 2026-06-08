import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/driver_api.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/cities.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';
import 'truck_register_screen.dart';
import 'post_availability_screen.dart';
import 'verification_screen.dart';

class DriverHomeTab extends StatefulWidget {
  const DriverHomeTab({super.key});

  @override
  State<DriverHomeTab> createState() => _DriverHomeTabState();
}

class _DriverHomeTabState extends State<DriverHomeTab> {
  Map<String, dynamic>? _truck;
  Map<String, dynamic>? _availability;
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    CityRepo.instance.load();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final r = await Future.wait([
      DriverApi.getTruck(),
      DriverApi.getAvailability(),
      DriverApi.getStats(),
    ]);
    if (!mounted) return;
    setState(() {
      _truck = r[0];
      _availability = r[1];
      _stats = r[2];
      _loading = false;
    });
  }

  Future<void> _cancel() async {
    final id = _availability?['id'];
    if (id == null) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel availability?'),
        content: const Text('You will stop receiving load matches.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Cancel it')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await DriverApi.cancelAvailability(id as int);
      await _load();
      if (mounted) showSuccess(context, 'Availability cancelled');
    } catch (e) {
      if (mounted) showError(context, e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          children: [
            Row(
              children: [
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
              ],
            ),
            const SizedBox(height: 24),
            _StatsRow(stats: _stats),
            const SizedBox(height: 20),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
              )
            else ...[
              if (_truck == null)
                _ActionCard(
                  icon: Icons.local_shipping_rounded,
                  title: 'Register your truck',
                  subtitle: 'Add truck details to start finding loads',
                  cta: 'Register',
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const TruckRegisterScreen())).then((_) => _load()),
                )
              else
                _TruckCard(truck: _truck!),
              if (_truck != null && _truck!['is_verified'] != 1) ...[
                const SizedBox(height: 12),
                _ActionCard(
                  icon: Icons.verified_user_rounded,
                  title: 'Complete verification',
                  subtitle: 'Upload licence, RC, insurance, truck photos',
                  cta: 'Upload docs',
                  onTap: () => Navigator.push(context,
                      MaterialPageRoute(builder: (_) => const VerificationScreen()))
                      .then((_) => _load()),
                ),
              ],
              const SizedBox(height: 14),
              if (_truck != null) ...[
                if (_availability == null)
                  _ActionCard(
                    icon: Icons.route_rounded,
                    title: 'Post your return route',
                    subtitle: 'Tell shippers where you\'re going',
                    cta: 'Post route',
                    onTap: () => Navigator.push(context,
                        MaterialPageRoute(builder: (_) => const PostAvailabilityScreen()))
                        .then((_) => _load()),
                  )
                else
                  _AvailabilityCard(av: _availability!, onCancel: _cancel),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _StatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final trips = stats?['totalTrips']?.toString() ?? '0';
    final earn = stats?['totalEarnings'] is num ? money.format(stats!['totalEarnings']) : '₹0';
    final rating = stats?['avgRating'] is num
        ? (stats!['avgRating'] as num).toStringAsFixed(1)
        : '—';
    return Row(children: [
      Expanded(child: _StatTile(label: 'Trips', value: trips, icon: Icons.flag_rounded)),
      const SizedBox(width: 10),
      Expanded(child: _StatTile(label: 'Earned', value: earn, icon: Icons.payments_rounded)),
      const SizedBox(width: 10),
      Expanded(child: _StatTile(label: 'Rating', value: rating, icon: Icons.star_rounded)),
    ]);
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _StatTile({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.muted)),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title, subtitle, cta;
  final VoidCallback onTap;
  const _ActionCard({required this.icon, required this.title, required this.subtitle, required this.cta, required this.onTap});

  @override
  Widget build(BuildContext context) {
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
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppTheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: AppTheme.muted)),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(onPressed: onTap, child: Text(cta)),
          ),
        ],
      ),
    );
  }
}

class _TruckCard extends StatelessWidget {
  final Map<String, dynamic> truck;
  const _TruckCard({required this.truck});

  @override
  Widget build(BuildContext context) {
    final verified = truck['is_verified'] == 1;
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
            const Icon(Icons.local_shipping_rounded, color: AppTheme.primary, size: 22),
            const SizedBox(width: 8),
            const Text('Your truck', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: verified ? AppTheme.success.withValues(alpha: 0.12) : AppTheme.warning.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(verified ? Icons.verified_rounded : Icons.hourglass_top_rounded,
                    size: 14, color: verified ? AppTheme.success : AppTheme.warning),
                const SizedBox(width: 4),
                Text(verified ? 'Verified' : 'Pending',
                    style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: verified ? AppTheme.success : AppTheme.warning)),
              ]),
            ),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            _InfoChip(icon: Icons.category_rounded, text: truck['truck_type']?.toString() ?? '—'),
            const SizedBox(width: 8),
            _InfoChip(icon: Icons.scale_rounded, text: '${truck['capacity_tons']} t'),
            if (truck['registration_number'] != null) ...[
              const SizedBox(width: 8),
              _InfoChip(icon: Icons.badge_outlined, text: truck['registration_number'].toString()),
            ],
          ]),
        ],
      ),
    );
  }
}

class _AvailabilityCard extends StatelessWidget {
  final Map<String, dynamic> av;
  final VoidCallback onCancel;
  const _AvailabilityCard({required this.av, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.accent,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.route_rounded, color: Colors.white, size: 22),
            const SizedBox(width: 8),
            const Text('Active return route',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.success,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('LIVE',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)),
            ),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            Column(children: const [
              Icon(Icons.my_location_rounded, color: Colors.white70, size: 18),
              SizedBox(height: 14),
              Icon(Icons.more_vert_rounded, color: Colors.white38, size: 14),
              SizedBox(height: 14),
              Icon(Icons.location_on_rounded, color: Colors.white70, size: 18),
            ]),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(av['current_city']?.toString() ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 30),
                  Text(av['destination_city']?.toString() ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ]),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: onCancel,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white24),
              ),
              child: const Text('Cancel availability'),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: AppTheme.muted),
        const SizedBox(width: 5),
        Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
