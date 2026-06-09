import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/api/booking_api.dart';
import '../../core/theme.dart';
import '../booking_detail_screen.dart';

class DriverLoadDetailScreen extends StatefulWidget {
  final Map<String, dynamic> load;
  final Map<String, dynamic> availability;
  final Map<String, dynamic> truck;

  const DriverLoadDetailScreen({
    super.key,
    required this.load,
    required this.availability,
    required this.truck,
  });

  @override
  State<DriverLoadDetailScreen> createState() => _DriverLoadDetailScreenState();
}

class _DriverLoadDetailScreenState extends State<DriverLoadDetailScreen> {
  bool _submitting = false;

  Future<void> _acceptLoad() async {
    setState(() => _submitting = true);
    try {
      final loadId = widget.load['id'] as int;
      final price = (widget.load['offered_price'] as num).toDouble();
      
      final booking = await BookingApi.create(
        loadId: loadId,
        agreedPrice: price,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Load accepted! Redirecting to active trip...'), backgroundColor: AppTheme.success),
      );
      
      final uuid = booking['uuid'] as String;
      
      // Navigate directly to active trip details screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookingDetailScreen(uuid: uuid),
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final load = widget.load;
    final progress = (load['route_progress_pct'] as num?)?.toInt() ?? 62;
    final detourPct = (load['detour_percent'] as num?)?.toDouble() ?? 6.0;
    final distOff = (load['pickup_distance_km'] as num?)?.toDouble() ?? 32.0;
    final price = (load['offered_price'] as num?)?.toDouble() ?? 14200.0;
    final weight = (load['weight_tons'] as num?)?.toDouble() ?? 7.5;
    final capacity = widget.availability['available_capacity_tons']?.toDouble() ?? 
                     widget.truck['capacity_tons']?.toDouble() ?? 9.0;
    
    final shipperName = load['shipper_name'] ?? 'Sree Textiles Pvt Ltd';
    final shipperRating = (load['shipper_rating'] as num?)?.toDouble() ?? 4.6;

    // Get initials for shipper profile
    final shipperInitials = shipperName.split(' ').take(2).map((s) => s.isNotEmpty ? s[0] : '').join().toUpperCase();

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Load on corridor',
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
                  // Load Summary Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16.0),
                    padding: const EdgeInsets.all(18),
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
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.accentWeak,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'CORRIDOR PICKUP',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: AppTheme.primaryDark,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 9),
                              RichText(
                                text: TextSpan(
                                  style: const TextStyle(
                                    fontSize: 18,
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
                              const SizedBox(height: 4),
                              Text(
                                '$weight t · ${load['cargo_type']} (palletised)',
                                style: const TextStyle(fontSize: 12.5, color: AppTheme.muted),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹${NumberFormat('#,##,###').format(price)}',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Route Location visual section title
                  const Padding(
                    padding: EdgeInsets.fromLTRB(20, 18, 20, 8),
                    child: Text(
                      'Where it sits on your route',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink2),
                    ),
                  ),

                  // Timeline Rail Detail Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16.0),
                    padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
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
                    child: Stack(
                      children: [
                        // Vertical rail
                        Positioned(
                          left: 11,
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
                                stops: [0.0, 0.62, 1.0],
                              ),
                            ),
                          ),
                        ),

                        // Nodes
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Kochi (0%)
                            _TimelineNode(
                              percent: '0%',
                              circleColor: AppTheme.primary,
                              circleBorderColor: AppTheme.primary,
                              nodeChild: const CircleAvatar(radius: 3, backgroundColor: Colors.white),
                              title: widget.availability['current_city'] ?? 'Kochi',
                              subtitle: 'You are here',
                            ),
                            
                            // Coimbatore (62%)
                            _TimelineNode(
                              percent: '$progress%',
                              circleColor: AppTheme.primary,
                              circleBorderColor: AppTheme.primary,
                              nodeChild: const Icon(Icons.arrow_upward_rounded, size: 8, color: Colors.white),
                              title: load['pickup_city'] ?? 'Coimbatore',
                              subtitle: 'Pickup · ${distOff.toStringAsFixed(0)} km off the line',
                              isAccent: true,
                            ),

                            // Spur description line indent
                            Padding(
                              padding: const EdgeInsets.only(left: 35.0, bottom: 8.0),
                              child: Text(
                                '→ drops at ${load['delivery_city']}, still heading toward ${widget.availability['destination_city']}',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: AppTheme.muted,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),

                            // Bangalore (100%)
                            _TimelineNode(
                              percent: '100%',
                              circleColor: AppTheme.surface,
                              circleBorderColor: AppTheme.muted,
                              nodeChild: const Icon(Icons.flag_rounded, size: 10, color: AppTheme.muted),
                              title: widget.availability['destination_city'] ?? 'Bangalore',
                              subtitle: 'Your destination',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Detour & Capacity Facts
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
                    child: Column(
                      children: [
                        _FactRow(
                          icon: Icons.check_circle_outline_rounded,
                          text: 'Adds +${detourPct.toStringAsFixed(0)}% detour to your trip',
                          subText: '≈ ${(552 * detourPct / 100).toStringAsFixed(0)} extra km over ${widget.availability['current_city']} → ${widget.availability['destination_city']}',
                        ),
                        const Divider(height: 1),
                        _FactRow(
                          icon: Icons.check_circle_outline_rounded,
                          text: 'Fits your ${capacity.toStringAsFixed(1)} t free capacity',
                          subText: '$weight t load · ${(capacity - weight).toStringAsFixed(1)} t to spare',
                        ),
                        const Divider(height: 1),
                        const _FactRow(
                          icon: Icons.info_outline_rounded,
                          text: 'Pickup window today, 2–6 PM',
                          subText: 'Loading expected within the window',
                        ),
                      ],
                    ),
                  ),

                  // Shipper Profile Card
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16.0),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppTheme.text,
                          child: Text(
                            shipperInitials.isNotEmpty ? shipperInitials : 'ST',
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                shipperName,
                                style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.text),
                              ),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  Row(
                                    children: List.generate(
                                      5,
                                      (i) => const Icon(Icons.star_rounded, size: 12, color: AppTheme.primary),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '$shipperRating · 38 trips',
                                    style: const TextStyle(fontSize: 12, color: AppTheme.muted, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chat_bubble_outline_rounded, color: AppTheme.text, size: 20),
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),

            // Footer Acceptance Button
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 26),
              child: FilledButton(
                onPressed: _submitting ? null : _acceptLoad,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Text('Accept load · earn ₹${NumberFormat('#,##,###').format(price)}'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TimelineNode extends StatelessWidget {
  final String percent;
  final Color circleColor;
  final Color circleBorderColor;
  final Widget nodeChild;
  final String title;
  final String subtitle;
  final bool isAccent;

  const _TimelineNode({
    required this.percent,
    required this.circleColor,
    required this.circleBorderColor,
    required this.nodeChild,
    required this.title,
    required this.subtitle,
    this.isAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9.0),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: circleColor,
              shape: BoxShape.circle,
              border: Border.all(color: circleBorderColor, width: 3),
            ),
            alignment: Alignment.center,
            child: nodeChild,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.text),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11.5,
                    color: isAccent ? AppTheme.primary : AppTheme.muted,
                    fontWeight: isAccent ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
          Text(
            percent,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isAccent ? AppTheme.primary : AppTheme.muted,
            ),
          ),
        ],
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final String subText;

  const _FactRow({
    required this.icon,
    required this.text,
    required this.subText,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 11.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  text,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.text),
                ),
                const SizedBox(height: 2),
                Text(
                  subText,
                  style: const TextStyle(fontSize: 11, color: AppTheme.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
