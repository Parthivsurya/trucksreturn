import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api/driver_api.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';
import 'truck_register_screen.dart';
import 'post_availability_screen.dart';
import 'verification_screen.dart';
import 'driver_load_detail_screen.dart';
import '../booking_detail_screen.dart';
import 'driver_earnings_screen.dart';

class DriverHomeTab extends StatefulWidget {
  final VoidCallback onViewMatches;
  const DriverHomeTab({super.key, required this.onViewMatches});

  @override
  State<DriverHomeTab> createState() => _DriverHomeTabState();
}

class _DriverHomeTabState extends State<DriverHomeTab> {
  Map<String, dynamic>? _truck;
  Map<String, dynamic>? _availability;
  List<Map<String, dynamic>> _matches = [];
  List<Map<String, dynamic>> _bookings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        DriverApi.getTruck(),
        DriverApi.getAvailability(),
        DriverApi.getBookings(),
      ]);

      _truck = results[0] as Map<String, dynamic>?;
      _availability = results[1] as Map<String, dynamic>?;
      _bookings = results[2] as List<Map<String, dynamic>>? ?? [];

      if (_availability != null) {
        final matchesRes = await DriverApi.getMatches();
        if (matchesRes['matches'] is List) {
          _matches = (matchesRes['matches'] as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        }
      } else {
        _matches = [];
      }
    } catch (e) {
      debugPrint('Error loading home data: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _getUserInitials(String name) {
    if (name.isEmpty) return 'D';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final String formattedDate = DateFormat('EEEE · h:mm a').format(DateTime.now());
    
    // Calculate availability time ago
    String availabilityTimeAgo = '';
    if (_availability != null) {
      final createdAtStr = _availability!['created_at']?.toString();
      if (createdAtStr != null) {
        try {
          final createdAt = DateTime.parse(createdAtStr).toLocal();
          final diff = DateTime.now().difference(createdAt);
          if (diff.inMinutes < 1) {
            availabilityTimeAgo = 'set just now';
          } else if (diff.inMinutes < 60) {
            availabilityTimeAgo = 'set ${diff.inMinutes}m ago';
          } else if (diff.inHours < 24) {
            availabilityTimeAgo = 'set ${diff.inHours}h ago';
          } else {
            availabilityTimeAgo = 'set ${diff.inDays}d ago';
          }
        } catch (_) {
          availabilityTimeAgo = 'set recently';
        }
      } else {
        availabilityTimeAgo = 'set recently';
      }
    }

    // Calculate stats
    final int matchedCount = _matches.length;
    double activeBookedEarnings = 0.0;
    double completedEarnings = 0.0;
    for (var b in _bookings) {
      final s = b['status']?.toString();
      if (s == 'confirmed' || s == 'picked_up' || s == 'in_transit') {
        activeBookedEarnings += (b['agreed_price'] as num?)?.toDouble() ?? 0.0;
      } else if (s == 'delivered') {
        completedEarnings += (b['agreed_price'] as num?)?.toDouble() ?? 0.0;
      }
    }

    double topMatchEarning = 0.0;
    for (var m in _matches) {
      final price = (m['offered_price'] as num?)?.toDouble() ?? 0.0;
      if (price > topMatchEarning) topMatchEarning = price;
    }

    double topEarning = topMatchEarning + activeBookedEarnings + completedEarnings;
    final String formattedEarning = topEarning > 0 
        ? (topEarning >= 10000 
            ? '₹${(topEarning / 1000).toStringAsFixed(1)}k' 
            : NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(topEarning))
        : '₹0';

    final double truckCapacity = _truck?['capacity_tons']?.toDouble() ?? 16.0;
    final double baseAvailabilityCap = _availability?['available_capacity_tons']?.toDouble() ?? truckCapacity;

    double bookedCapacity = 0.0;
    int activeBookingsCount = 0;
    for (var b in _bookings) {
      final s = b['status']?.toString();
      if (s == 'confirmed' || s == 'picked_up' || s == 'in_transit') {
        bookedCapacity += (b['weight_tons'] as num?)?.toDouble() ?? 0.0;
        activeBookingsCount++;
      }
    }

    double freeCap;
    if (activeBookingsCount == 0) {
      freeCap = truckCapacity;
    } else {
      freeCap = baseAvailabilityCap - bookedCapacity;
    }
    if (freeCap < 0) freeCap = 0.0;

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        titleSpacing: 20,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              formattedDate,
              style: const TextStyle(color: AppTheme.muted, fontSize: 12, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 1),
            Text(
              'Namaste, ${user?.name ?? 'Driver'}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.text),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_rounded, color: AppTheme.text, size: 26),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
          Padding(
            padding: const EdgeInsets.only(right: 20.0),
            child: CircleAvatar(
              radius: 20,
              backgroundColor: AppTheme.text,
              child: Text(
                _getUserInitials(user?.name ?? 'Driver'),
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          color: AppTheme.primary,
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
              : ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                  children: [
                    // Truck Plate Badge
                    if (_truck != null && _truck!['registration_number'] != null)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFFB8E6E8)),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _truck!['registration_number'].toString().toUpperCase(),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary,
                            ),
                          ),
                        ),
                      ),

                    // ACTIVE availability route card
                    if (_availability != null) ...[
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [
                            BoxShadow(
                              color: Color.fromRGBO(34, 40, 49, 0.1),
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
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: AppTheme.accentWeak,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      // Blinking dot simulation
                                      CircleAvatar(radius: 3.5, backgroundColor: AppTheme.primary),
                                      SizedBox(width: 5),
                                      Text(
                                        'Return route active',
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.primaryDark,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                 Text(
                                   availabilityTimeAgo,
                                   style: const TextStyle(fontSize: 11.5, color: AppTheme.muted),
                                 ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            // Route timeline with arrow
                            Row(
                              children: [
                                Text(
                                  _availability!['current_city'] ?? '',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.text),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      // Dashed Line representation
                                      Row(
                                        children: List.generate(
                                          12,
                                          (i) => Expanded(
                                            child: Container(
                                              height: 2,
                                              margin: const EdgeInsets.symmetric(horizontal: 1.5),
                                              color: i % 2 == 0 ? AppTheme.primary : Colors.transparent,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const Align(
                                        alignment: Alignment.centerRight,
                                        child: Icon(Icons.play_arrow_rounded, color: AppTheme.primary, size: 12),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  _availability!['destination_city'] ?? '',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.text),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            // Corridor Stats row
                            Row(
                              children: [
                                _StatWidget(
                                  value: matchedCount.toString(),
                                  label: 'loads on\ncorridor',
                                ),
                                const SizedBox(width: 10),
                                _StatWidget(
                                  value: formattedEarning,
                                  label: 'top earning\npotential',
                                  isAccent: true,
                                ),
                                const SizedBox(width: 10),
                                _StatWidget(
                                  value: '${freeCap.toStringAsFixed(1)}t',
                                  label: 'free capacity\n(LTL)',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      // Matched loads CTA button
                      FilledButton(
                        onPressed: widget.onViewMatches,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 9),
                            Text('View $matchedCount matched loads'),
                          ],
                        ),
                      ),
                    ] else ...[
                      // If no active route, show Post Route CTA
                      if (_truck != null)
                        _ActionCTAButton(
                          icon: Icons.route_rounded,
                          title: 'Post your return route',
                          subtitle: 'Tell shippers where you\'re going to get matched loads',
                          cta: 'Post route',
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const PostAvailabilityScreen()),
                          ).then((_) => _loadData()),
                        ),
                    ],

                    // Quick Actions
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _QuickActionButton(
                            icon: Icons.pin_drop_rounded,
                            label: 'Change route',
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const PostAvailabilityScreen()),
                            ).then((_) => _loadData()),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _QuickActionButton(
                            icon: Icons.local_shipping_rounded,
                            label: 'My truck',
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const TruckRegisterScreen()),
                            ).then((_) => _loadData()),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _QuickActionButton(
                            icon: Icons.trending_up_rounded,
                            label: 'Earnings',
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const DriverEarningsScreen()),
                            ).then((_) => _loadData()),
                          ),
                        ),
                      ],
                    ),

                    // Dynamic Warning / Registration Cards
                    if (_truck == null) ...[
                      const SizedBox(height: 20),
                      _ActionCTAButton(
                        icon: Icons.local_shipping_rounded,
                        title: 'Register your truck',
                        subtitle: 'Add truck details to start finding return loads',
                        cta: 'Register truck',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const TruckRegisterScreen()),
                        ).then((_) => _loadData()),
                      ),
                    ] else if (_truck!['is_verified'] != 1) ...[
                      const SizedBox(height: 20),
                      _ActionCTAButton(
                        icon: Icons.verified_user_rounded,
                        title: 'Complete verification',
                        subtitle: 'Upload registration files to verify account status',
                        cta: 'Upload docs',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const VerificationScreen()),
                        ).then((_) => _loadData()),
                      ),
                    ],

                    // Matched Loads Timeline
                    if (_availability != null) ...[
                      const SizedBox(height: 22),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'On your corridor now',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ink2),
                          ),
                          GestureDetector(
                            onTap: widget.onViewMatches,
                            child: const Text(
                              'See all →',
                              style: TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      // Top 2 matches preview
                      if (_matches.isEmpty)
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(20.0),
                            child: Center(
                              child: Text(
                                'No matching loads on route yet.',
                                style: TextStyle(color: AppTheme.muted),
                              ),
                            ),
                          ),
                        )
                      else
                        ..._matches.take(2).map((load) {
                          final detour = (load['detour_percent'] as num?)?.toDouble() ?? 0.0;
                          final progress = (load['route_progress_pct'] as num?)?.toInt() ?? 0;
                          final distOff = (load['pickup_distance_km'] as num?)?.toDouble() ?? 0.0;
                          final price = (load['offered_price'] as num?)?.toDouble() ?? 0.0;
                          
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
                            ).then((_) => _loadData()),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 11),
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
                                              '${load['weight_tons']} t · ${load['cargo_type']}',
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
                                  Container(
                                    height: 1,
                                    color: AppTheme.border,
                                  ),
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
                                            letterSpacing: 0.2,
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
                                      Text(
                                        '${distOff.toStringAsFixed(0)} km off line',
                                        style: const TextStyle(fontSize: 11.5, color: AppTheme.muted),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                    ],

                    // Bookings / Orders Section
                    if (_bookings.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      const Text(
                        'Your bookings & trips',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.ink2),
                      ),
                      const SizedBox(height: 10),
                      ..._bookings.map((booking) {
                        final status = booking['status']?.toString() ?? 'confirmed';
                        final price = booking['agreed_price'] is num 
                            ? NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(booking['agreed_price'])
                            : '—';

                        Color statusBgColor = AppTheme.border;
                        Color statusTextColor = AppTheme.text;
                        String statusLabel = status;

                        if (status == 'confirmed') {
                          statusBgColor = AppTheme.accentWeak;
                          statusTextColor = AppTheme.primaryDark;
                          statusLabel = 'Confirmed';
                        } else if (status == 'picked_up') {
                          statusBgColor = const Color(0xFFFFF3E0);
                          statusTextColor = Colors.orange[800]!;
                          statusLabel = 'Picked Up';
                        } else if (status == 'in_transit') {
                          statusBgColor = AppTheme.accentWeak;
                          statusTextColor = AppTheme.primary;
                          statusLabel = 'In Transit';
                        } else if (status == 'delivered') {
                          statusBgColor = const Color(0xFFE8F5E9);
                          statusTextColor = Colors.green[800]!;
                          statusLabel = 'Delivered';
                        } else if (status == 'cancelled') {
                          statusBgColor = const Color(0xFFFFEBEE);
                          statusTextColor = AppTheme.danger;
                          statusLabel = 'Cancelled';
                        }

                        return GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => BookingDetailScreen(uuid: booking['uuid']),
                            ),
                          ).then((_) => _loadData()),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 11),
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
                                  children: [
                                    RichText(
                                      text: TextSpan(
                                        style: const TextStyle(
                                          fontSize: 14.5,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.text,
                                          fontFamily: 'Roboto',
                                        ),
                                        children: [
                                          TextSpan(text: booking['pickup_city'] ?? ''),
                                          const TextSpan(
                                            text: ' → ',
                                            style: TextStyle(color: AppTheme.muted, fontWeight: FontWeight.normal),
                                          ),
                                          TextSpan(text: booking['delivery_city'] ?? ''),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusBgColor,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        statusLabel,
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: statusTextColor),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '${booking['weight_tons'] ?? 7.5} t · ${booking['cargo_type'] ?? 'General Cargo'}',
                                      style: const TextStyle(fontSize: 12, color: AppTheme.muted),
                                    ),
                                    Text(
                                      price,
                                      style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.text),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 40),
                  ],
                ),
        ),
      ),
    );
  }
}

class _StatWidget extends StatelessWidget {
  final String value;
  final String label;
  final bool isAccent;

  const _StatWidget({
    required this.value,
    required this.label,
    this.isAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(11.0),
        decoration: BoxDecoration(
          color: AppTheme.bg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.w900,
                color: isAccent ? AppTheme.primary : AppTheme.text,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10.5,
                color: AppTheme.muted,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(
              color: Color.fromRGBO(34, 40, 49, 0.06),
              blurRadius: 2,
              offset: Offset(0, 1),
            )
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primary, size: 20),
            const SizedBox(height: 7),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
                color: AppTheme.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCTAButton extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String cta;
  final VoidCallback onTap;

  const _ActionCTAButton({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.accentWeak,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppTheme.primary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.text),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 13, color: AppTheme.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onTap,
              child: Text(cta),
            ),
          ),
        ],
      ),
    );
  }
}

