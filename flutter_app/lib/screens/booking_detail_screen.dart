import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/api/booking_api.dart';
import '../core/api/tracking_service.dart';
import '../core/api/tracking_transmitter.dart';
import '../core/auth/auth_provider.dart';
import '../core/theme.dart';
import '../widgets/rating_sheet.dart';

class BookingDetailScreen extends StatefulWidget {
  final String uuid;
  const BookingDetailScreen({super.key, required this.uuid});

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  BookingDetail? _detail;
  bool _loading = true;
  bool _updating = false;
  String? _error;
  
  TrackingService? _tracker;
  TrackingTransmitter? _transmitter;
  bool _transmitterStarting = false;
  String? _lastPingAt;

  @override
  void initState() {
    super.initState();
    _load().then((_) => _startTracking());
  }

  @override
  void dispose() {
    _tracker?.dispose();
    _transmitter?.stop();
    super.dispose();
  }

  Future<void> _toggleTransmitter() async {
    if (_transmitter != null) {
      _transmitter!.stop();
      setState(() => _transmitter = null);
      return;
    }
    setState(() => _transmitterStarting = true);
    final ok = await TrackingTransmitter.ensurePermission();
    if (!mounted) return;
    if (!ok) {
      setState(() => _transmitterStarting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location permission is required to share live position'), backgroundColor: AppTheme.danger),
      );
      return;
    }
    final t = TrackingTransmitter(
      uuid: widget.uuid,
      onPing: (pos) {
        if (!mounted) return;
        setState(() => _lastPingAt = DateFormat('h:mm:ss a').format(DateTime.now()));
      },
      onError: (msg) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(msg), backgroundColor: AppTheme.danger),
          );
        }
      },
    );
    await t.start();
    if (!mounted) {
      t.stop();
      return;
    }
    setState(() {
      _transmitter = t;
      _transmitterStarting = false;
    });
  }

  void _startTracking() {
    if (_detail == null) return;
    final status = _detail!.booking['status']?.toString() ?? '';
    if (status == 'delivered' || status == 'cancelled') return;
    _tracker = TrackingService(
      uuid: widget.uuid,
      onConnection: (live) {
        // Tracker connection status updated
      },
      onEvent: _handleEvent,
    );
    _tracker!.start();
  }

  void _handleEvent(TrackEvent ev) {
    if (!mounted || _detail == null) return;
    switch (ev.type) {
      case 'tracking':
        setState(() {
          _detail = BookingDetail(
            booking: _detail!.booking,
            tracking: [..._detail!.tracking, ev.data],
          );
        });
        break;
      case 'status':
        final newBooking = Map<String, dynamic>.from(_detail!.booking);
        newBooking['status'] = ev.data['status'];
        if (ev.data['picked_up_at'] != null) newBooking['picked_up_at'] = ev.data['picked_up_at'];
        if (ev.data['delivered_at'] != null) newBooking['delivered_at'] = ev.data['delivered_at'];
        setState(() => _detail = BookingDetail(booking: newBooking, tracking: _detail!.tracking));
        final s = ev.data['status']?.toString();
        if (s == 'delivered' || s == 'cancelled') {
          _transmitter?.stop();
          if (mounted) setState(() => _transmitter = null);
        }
        break;
      case 'snapshot':
        final b = ev.data['booking'];
        final t = ev.data['tracking'];
        if (b is Map) {
          setState(() => _detail = BookingDetail(
                booking: Map<String, dynamic>.from(b),
                tracking: (t is List)
                    ? t.map((e) => Map<String, dynamic>.from(e as Map)).toList()
                    : _detail!.tracking,
              ));
        }
        break;
    }
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final d = await BookingApi.getByUuid(widget.uuid);
      if (!mounted) return;
      setState(() {
        _detail = d;
        _error = d == null ? 'Booking not found' : null;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _setStatus(String status, String confirmMsg) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Confirm Status Update'),
        content: Text(confirmMsg),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true), 
            style: FilledButton.styleFrom(minimumSize: const Size(100, 44)),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _updating = true);
    try {
      await BookingApi.updateStatus(widget.uuid, status);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Status updated successfully.'), backgroundColor: AppTheme.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.danger),
        );
      }
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final String titleText;
    if (_loading || _detail == null) {
      titleText = 'Trip details';
    } else {
      final status = _detail!.booking['status']?.toString() ?? 'confirmed';
      if (status == 'delivered') {
        titleText = 'Completed trip';
      } else if (status == 'cancelled') {
        titleText = 'Cancelled trip';
      } else {
        titleText = 'Active trip';
      }
    }

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          titleText,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.text),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.warning_amber_rounded, size: 56, color: AppTheme.muted),
                          const SizedBox(height: 12),
                          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.muted)),
                        ],
                      ),
                    ),
                  )
                : _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    final b = _detail!.booking;
    final auth = context.read<AuthProvider>();
    final isDriver = auth.isDriver;
    final status = b['status']?.toString() ?? 'confirmed';
    
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final price = b['agreed_price'] is num ? money.format(b['agreed_price']) : '—';
    final otherName = isDriver ? b['shipper_name'] : b['driver_name'];
    final otherPhone = isDriver ? b['shipper_phone'] : b['driver_phone'];
    final shipperInitials = (otherName?.toString().isNotEmpty == true ? otherName.toString().split(' ').take(2).map((s) => s[0]).join() : 'ST').toUpperCase();

    // Map status to stepper steps progress
    int stepProgress = 0;
    if (status == 'confirmed') stepProgress = 1;
    if (status == 'picked_up') stepProgress = 2;
    if (status == 'in_transit') stepProgress = 3;
    if (status == 'delivered') stepProgress = 4;

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: 14.0),
        children: [
          // Visual Stepper Progress Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
            child: _TripStepper(currentStep: stepProgress),
          ),

          // Custom Map View
          _MapWidget(isLiveSharing: _transmitter != null),

          // Active Trip Details Card
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
            padding: const EdgeInsets.all(15),
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
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.text,
                          fontFamily: 'Roboto',
                        ),
                        children: [
                          TextSpan(text: b['pickup_city'] ?? ''),
                          const TextSpan(
                            text: ' → ',
                            style: TextStyle(color: AppTheme.muted, fontWeight: FontWeight.normal),
                          ),
                          TextSpan(text: b['delivery_city'] ?? ''),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.accentWeak,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircleAvatar(radius: 3, backgroundColor: AppTheme.primary),
                          SizedBox(width: 4),
                          Text(
                            'On time',
                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: AppTheme.primaryDark),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                _TripDetailRow(label: 'Cargo', value: '${b['weight_tons'] ?? 7.5} t · ${b['cargo_type'] ?? 'Textiles'}'),
                _TripDetailRow(label: 'Distance left', value: '218 km · ~4h 10m'), // Simulated distance metrics
                _TripDetailRow(label: 'You earn', value: price, isAccent: true),
              ],
            ),
          ),

          // Shipper Info Card
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
                    shipperInitials,
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        otherName?.toString() ?? 'Sree Textiles Pvt Ltd',
                        style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold, color: AppTheme.text),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Shipper · notified on every update',
                        style: TextStyle(fontSize: 12, color: AppTheme.muted, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.phone_rounded, color: AppTheme.primary, size: 20),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Calling $otherName ($otherPhone)...'),
                        backgroundColor: AppTheme.primaryDark,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          
          // Live transmitter control card (visible to drivers only during active trip)
          if (isDriver && status != 'delivered' && status != 'cancelled') ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: _TransmitterControlCard(
                isActive: _transmitter != null,
                lastPingAt: _lastPingAt,
                latitude: _transmitter?.lastPosition?.latitude,
                longitude: _transmitter?.lastPosition?.longitude,
                onToggle: _transmitterStarting ? null : () => _toggleTransmitter(),
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Footer Action buttons
          if (isDriver)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: _buildDriverWorkflowButton(status),
            ),

          if (status == 'delivered')
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: _ratePrompt(isDriver, b),
            ),
        ],
      ),
    );
  }

  Widget _buildDriverWorkflowButton(String status) {
    if (status == 'confirmed') {
      return FilledButton(
        onPressed: _updating ? null : () => _setStatus('picked_up', 'Confirm load has been picked up?'),
        child: const Text('Mark as picked up'),
      );
    }
    if (status == 'picked_up') {
      return FilledButton(
        onPressed: _updating ? null : () => _setStatus('in_transit', 'Mark as in transit?'),
        child: const Text('Start trip'),
      );
    }
    if (status == 'in_transit') {
      return FilledButton(
        onPressed: _updating ? null : () => _setStatus('delivered', 'Confirm delivery is complete?'),
        child: const Text('Mark as delivered'),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _ratePrompt(bool isDriver, Map<String, dynamic> b) {
    final hasRated = b['has_rated'] == true;
    final otherName = (isDriver ? b['shipper_name'] : b['driver_name'])?.toString() ?? 'Shipper';
    final otherRole = isDriver ? 'shipper' : 'driver';
    
    if (hasRated) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.primaryDark.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.primaryDark.withValues(alpha: 0.3)),
        ),
        child: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: AppTheme.primaryDark, size: 20),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'You rated this trip. Thanks!',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
              ),
            ),
          ],
        ),
      );
    }
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.star_rounded, color: AppTheme.primary, size: 22),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Rate your trip',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'How was working with $otherName?',
            style: const TextStyle(color: AppTheme.muted, fontSize: 13),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: () async {
              final ok = await showRatingSheet(
                context,
                uuid: widget.uuid,
                counterpartyName: otherName,
                counterpartyRole: otherRole,
              );
              if (ok && mounted) _load();
            },
            child: Text('Rate $otherName'),
          ),
        ],
      ),
    );
  }
}

class _TripStepper extends StatelessWidget {
  final int currentStep; // 1 = Confirmed, 2 = Picked up, 3 = In transit, 4 = Delivered

  const _TripStepper({required this.currentStep});

  @override
  Widget build(BuildContext context) {
    final List<String> steps = ['Confirmed', 'Picked up', 'In transit', 'Delivered'];

    return Stack(
      children: [
        // Horizontal connection line
        Positioned(
          left: 20,
          right: 20,
          top: 11,
          child: Container(
            height: 2,
            color: AppTheme.border,
          ),
        ),
        // Active Progress line
        if (currentStep > 1)
          Positioned(
            left: 20,
            width: MediaQuery.of(context).size.width * 0.23 * (currentStep - 1),
            top: 11,
            child: Container(
              height: 2,
              color: AppTheme.primary,
            ),
          ),
        // Stepper dots
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(4, (i) {
            final stepIdx = i + 1;
            final isDone = stepIdx < currentStep || currentStep == 4;
            final isCurrent = stepIdx == currentStep && currentStep != 4;

            Color circleColor = AppTheme.surface;
            Color borderColor = AppTheme.border;
            Widget stepWidget = Text(
              stepIdx.toString(),
              style: const TextStyle(fontSize: 11, color: AppTheme.muted, fontWeight: FontWeight.bold),
            );

            if (isDone) {
              circleColor = AppTheme.primary;
              borderColor = AppTheme.primary;
              stepWidget = const Icon(Icons.check, size: 12, color: Colors.white);
            } else if (isCurrent) {
              borderColor = AppTheme.primary;
              stepWidget = const CircleAvatar(radius: 4, backgroundColor: AppTheme.primary);
            }

            return Column(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: circleColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: borderColor, width: 2),
                    boxShadow: isCurrent
                        ? [
                            BoxShadow(
                              color: AppTheme.accentWeak,
                              blurRadius: 0,
                              spreadRadius: 4,
                            )
                          ]
                        : null,
                  ),
                  alignment: Alignment.center,
                  child: stepWidget,
                ),
                const SizedBox(height: 7),
                Text(
                  steps[i],
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: (isDone || isCurrent) ? FontWeight.bold : FontWeight.normal,
                    color: (isDone || isCurrent) ? AppTheme.text : AppTheme.muted,
                  ),
                ),
              ],
            );
          }),
        ),
      ],
    );
  }
}

class _MapWidget extends StatelessWidget {
  final bool isLiveSharing;

  const _MapWidget({required this.isLiveSharing});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 190,
      margin: const EdgeInsets.symmetric(horizontal: 16.0),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F5F6),
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
          // Grid lines mockup background
          Positioned.fill(
            child: Opacity(
              opacity: 0.1,
              child: CustomPaint(
                painter: GridPainter(),
              ),
            ),
          ),
          // Road Path Line
          Positioned.fill(
            child: CustomPaint(
              painter: RoadPainter(),
            ),
          ),
          // Moving Truck position
          Positioned(
            left: MediaQuery.of(context).size.width * 0.42,
            top: 60,
            child: Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: AppTheme.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.white,
                    spreadRadius: 3,
                  )
                ],
              ),
            ),
          ),
          // Blinking Live badge
          Positioned(
            left: 11,
            top: 11,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [
                  BoxShadow(
                    color: Color.fromRGBO(34, 40, 49, 0.1),
                    blurRadius: 2,
                    offset: Offset(0, 1),
                  )
                ],
              ),
              child: Row(
                children: [
                  if (isLiveSharing) ...[
                    const _BlinkingDot(),
                    const SizedBox(width: 7),
                    const Text(
                      'Live · sharing every 15s',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.text),
                    ),
                  ] else ...[
                    const CircleAvatar(radius: 3.5, backgroundColor: AppTheme.muted),
                    const SizedBox(width: 7),
                    const Text(
                      'Location sharing inactive',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.muted),
                    ),
                  ]
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BlinkingDot extends StatefulWidget {
  const _BlinkingDot();

  @override
  State<_BlinkingDot> createState() => _BlinkingDotState();
}

class _BlinkingDotState extends State<_BlinkingDot> with SingleTickerProviderStateMixin {
  late AnimationController _anim;

  @override
  void initState() {
    super.initState();
    _anim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: const CircleAvatar(
        radius: 3.5,
        backgroundColor: AppTheme.primary,
      ),
    );
  }
}

class GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.muted
      ..strokeWidth = 1;

    for (double i = 0; i < size.width; i += 24) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += 24) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class RoadPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.primary.withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(-10, size.height * 0.6)
      ..cubicTo(size.width * 0.3, size.height * 0.5, size.width * 0.6, size.height * 0.25, size.width + 10, size.height * 0.3);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _TripDetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isAccent;

  const _TripDetailRow({
    required this.label,
    required this.value,
    this.isAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12.5, color: AppTheme.muted)),
          Text(
            value,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
              color: isAccent ? AppTheme.primary : AppTheme.text,
            ),
          ),
        ],
      ),
    );
  }
}

class _TransmitterControlCard extends StatelessWidget {
  final bool isActive;
  final String? lastPingAt;
  final double? latitude;
  final double? longitude;
  final VoidCallback? onToggle;

  const _TransmitterControlCard({
    required this.isActive,
    required this.lastPingAt,
    required this.latitude,
    required this.longitude,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isActive ? AppTheme.primaryDark : AppTheme.border, width: isActive ? 1.5 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isActive ? AppTheme.accentWeak : AppTheme.bg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isActive ? Icons.my_location_rounded : Icons.location_disabled_rounded,
                  color: isActive ? AppTheme.primaryDark : AppTheme.muted,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isActive ? 'Sharing live location' : 'Share live location',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.text),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      isActive
                          ? (lastPingAt != null ? 'Last ping: $lastPingAt' : 'Sending position…')
                          : 'Shipper sees your truck on the map',
                      style: const TextStyle(color: AppTheme.muted, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isActive,
                onChanged: onToggle == null ? null : (_) => onToggle!(),
                activeTrackColor: AppTheme.accentWeak,
                activeThumbColor: AppTheme.primary,
              ),
            ],
          ),
          if (isActive && latitude != null && longitude != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.place_rounded, size: 14, color: AppTheme.muted),
                const SizedBox(width: 6),
                Text(
                  '${latitude!.toStringAsFixed(5)}, ${longitude!.toStringAsFixed(5)}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.muted, fontFamily: 'monospace'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
