import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../core/api/booking_api.dart';
import '../core/api/tracking_service.dart';
import '../core/api/tracking_transmitter.dart';
import '../core/auth/auth_provider.dart';
import '../core/theme.dart';
import '../widgets/app_button.dart';
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
  bool _live = false;
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
      showError(context, 'Location permission is required to share live position');
      return;
    }
    final t = TrackingTransmitter(
      uuid: widget.uuid,
      onPing: (pos) {
        if (!mounted) return;
        setState(() => _lastPingAt = DateFormat('h:mm:ss a').format(DateTime.now()));
      },
      onError: (msg) {
        if (mounted) showError(context, msg);
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
        if (!mounted) return;
        setState(() => _live = live);
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
        title: const Text('Confirm'),
        content: Text(confirmMsg),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Confirm')),
        ],
      ),
    );
    if (ok != true) return;
    setState(() => _updating = true);
    try {
      await BookingApi.updateStatus(widget.uuid, status);
      await _load();
      if (mounted) showSuccess(context, 'Status updated');
    } catch (e) {
      if (mounted) showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _updating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Booking'),
        actions: [
          if (_tracker != null)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: (_live ? AppTheme.success : AppTheme.muted).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.circle, size: 8, color: _live ? AppTheme.success : AppTheme.muted),
                    const SizedBox(width: 6),
                    Text(_live ? 'LIVE' : 'POLLING',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: _live ? AppTheme.success : AppTheme.muted,
                        )),
                  ]),
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.warning_amber_rounded, size: 56, color: AppTheme.muted),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center,
                            style: const TextStyle(color: AppTheme.muted)),
                      ]),
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

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          _StatusBanner(status: status),
          const SizedBox(height: 16),
          _Card(
            children: [
              const Text('Route', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.muted)),
              const SizedBox(height: 12),
              _routeRow(Icons.my_location_rounded, AppTheme.success,
                  b['pickup_city']?.toString() ?? '', b['pickup_address']?.toString()),
              const Padding(
                padding: EdgeInsets.only(left: 7, top: 6, bottom: 6),
                child: SizedBox(height: 18, child: VerticalDivider(width: 1, color: AppTheme.border)),
              ),
              _routeRow(Icons.location_on_rounded, AppTheme.danger,
                  b['delivery_city']?.toString() ?? '', b['delivery_address']?.toString()),
            ],
          ),
          const SizedBox(height: 12),
          _Card(
            children: [
              const Text('Load details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.muted)),
              const SizedBox(height: 10),
              _row('Cargo', b['cargo_type']?.toString() ?? '—'),
              _row('Weight', b['weight_tons'] != null ? '${b['weight_tons']} tons' : '—'),
              if (b['handling_instructions'] != null)
                _row('Handling', b['handling_instructions'].toString()),
              const Divider(height: 24),
              _row('Agreed price', price, bold: true),
            ],
          ),
          const SizedBox(height: 12),
          _Card(
            children: [
              Text(isDriver ? 'Shipper' : 'Driver',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.muted)),
              const SizedBox(height: 10),
              Row(children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    (otherName?.toString().isNotEmpty == true ? otherName.toString()[0] : '?').toUpperCase(),
                    style: const TextStyle(fontWeight: FontWeight.w800, color: AppTheme.primary),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(otherName?.toString() ?? '—',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      if (otherPhone != null)
                        Text(otherPhone.toString(),
                            style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
                    ],
                  ),
                ),
                if (otherPhone != null)
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.phone_rounded, color: AppTheme.success),
                  ),
              ]),
              if (isDriver && b['truck_type'] != null) ...[
                const Divider(height: 24),
                _row('Your truck', '${b['truck_type']} • ${b['capacity_tons']}t'),
              ],
            ],
          ),
          if (_detail!.tracking.isNotEmpty) ...[
            const SizedBox(height: 12),
            _Card(
              children: [
                const Text('Tracking',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppTheme.muted)),
                const SizedBox(height: 10),
                ..._detail!.tracking.map((t) {
                  final at = t['created_at']?.toString();
                  String when = '';
                  if (at != null) {
                    try {
                      when = DateFormat('d MMM, h:mm a').format(DateTime.parse(at).toLocal());
                    } catch (_) {}
                  }
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Icon(Icons.fiber_manual_record, size: 10, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(t['status_message']?.toString() ?? 'Location update',
                                style: const TextStyle(fontWeight: FontWeight.w600)),
                            if (when.isNotEmpty)
                              Text(when, style: const TextStyle(color: AppTheme.muted, fontSize: 12)),
                          ],
                        ),
                      ),
                    ]),
                  );
                }),
              ],
            ),
          ],
          const SizedBox(height: 20),
          if (isDriver) _driverActions(status),
          if (status == 'delivered') _ratePrompt(isDriver, b),
        ],
      ),
    );
  }

  Widget _ratePrompt(bool isDriver, Map<String, dynamic> b) {
    final hasRated = b['has_rated'] == true;
    final otherName = (isDriver ? b['shipper_name'] : b['driver_name'])?.toString() ?? '';
    final otherRole = isDriver ? 'shipper' : 'driver';
    if (hasRated) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.success.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.success.withValues(alpha: 0.3)),
        ),
        child: const Row(children: [
          Icon(Icons.check_circle_rounded, color: AppTheme.success, size: 20),
          SizedBox(width: 10),
          Expanded(child: Text('You rated this trip. Thanks!',
              style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.success))),
        ]),
      );
    }
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.warning, width: 1.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.star_rounded, color: AppTheme.warning, size: 22),
          const SizedBox(width: 8),
          const Expanded(
            child: Text('Rate your trip',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ),
        ]),
        const SizedBox(height: 6),
        Text(
          otherName.isEmpty ? 'Share feedback about the $otherRole.' : 'How was working with $otherName?',
          style: const TextStyle(color: AppTheme.muted, fontSize: 13),
        ),
        const SizedBox(height: 12),
        PrimaryButton(
          label: 'Rate ${otherName.isEmpty ? otherRole : otherName}',
          icon: Icons.star_rounded,
          onPressed: () async {
            final ok = await showRatingSheet(
              context,
              uuid: widget.uuid,
              counterpartyName: otherName.isEmpty ? otherRole : otherName,
              counterpartyRole: otherRole,
            );
            if (ok && mounted) _load();
          },
        ),
      ]),
    );
  }

  Widget _driverActions(String status) {
    if (status == 'confirmed') {
      return Column(children: [
        PrimaryButton(
          label: 'Mark as picked up',
          icon: Icons.inventory_rounded,
          loading: _updating,
          onPressed: () => _setStatus('picked_up', 'Confirm load has been picked up?'),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: _updating ? null : () => _setStatus('cancelled', 'Cancel this booking?'),
          icon: const Icon(Icons.close_rounded, color: AppTheme.danger),
          label: const Text('Cancel booking', style: TextStyle(color: AppTheme.danger)),
          style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.danger)),
        ),
      ]);
    }
    if (status == 'picked_up') {
      return Column(children: [
        _transmitterCard(),
        const SizedBox(height: 12),
        PrimaryButton(
          label: 'Start trip',
          icon: Icons.navigation_rounded,
          loading: _updating,
          onPressed: () => _setStatus('in_transit', 'Mark as in transit?'),
        ),
      ]);
    }
    if (status == 'in_transit') {
      return Column(children: [
        _transmitterCard(),
        const SizedBox(height: 12),
        PrimaryButton(
          label: 'Mark as delivered',
          icon: Icons.task_alt_rounded,
          loading: _updating,
          onPressed: () => _setStatus('delivered', 'Confirm delivery is complete?'),
        ),
      ]);
    }
    return const SizedBox.shrink();
  }

  Widget _transmitterCard() {
    final on = _transmitter != null;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: on ? AppTheme.success : AppTheme.border, width: on ? 1.5 : 1),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: (on ? AppTheme.success : AppTheme.muted).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(on ? Icons.my_location_rounded : Icons.location_disabled_rounded,
                size: 20, color: on ? AppTheme.success : AppTheme.muted),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(on ? 'Sharing live location' : 'Share live location',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              const SizedBox(height: 2),
              Text(
                on
                    ? (_lastPingAt != null ? 'Last ping: $_lastPingAt' : 'Sending position…')
                    : 'Shipper sees your truck on the map',
                style: const TextStyle(color: AppTheme.muted, fontSize: 12),
              ),
            ]),
          ),
          Switch(
            value: on,
            onChanged: _transmitterStarting ? null : (_) => _toggleTransmitter(),
            activeThumbColor: AppTheme.success,
          ),
        ]),
        if (on && _transmitter?.lastPosition != null) ...[
          const SizedBox(height: 12),
          Row(children: [
            const Icon(Icons.place_rounded, size: 14, color: AppTheme.muted),
            const SizedBox(width: 6),
            Text(
              '${_transmitter!.lastPosition!.latitude.toStringAsFixed(5)}, ${_transmitter!.lastPosition!.longitude.toStringAsFixed(5)}',
              style: const TextStyle(fontSize: 12, color: AppTheme.muted, fontFamily: 'monospace'),
            ),
          ]),
        ],
      ]),
    );
  }

  Widget _routeRow(IconData icon, Color color, String city, String? addr) {
    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, size: 18, color: color),
      const SizedBox(width: 8),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(city, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          if (addr != null && addr.isNotEmpty)
            Text(addr, style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
        ]),
      ),
    ]);
  }

  Widget _row(String k, String v, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(child: Text(k, style: const TextStyle(color: AppTheme.muted, fontSize: 13))),
        Text(v, style: TextStyle(fontWeight: bold ? FontWeight.w800 : FontWeight.w600, fontSize: bold ? 16 : 14)),
      ]),
    );
  }
}

class _Card extends StatelessWidget {
  final List<Widget> children;
  const _Card({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  final String status;
  const _StatusBanner({required this.status});

  @override
  Widget build(BuildContext context) {
    final (color, icon, title, subtitle) = switch (status) {
      'confirmed' => (AppTheme.accent, Icons.check_circle_rounded, 'Confirmed', 'Head to pickup location'),
      'picked_up' => (AppTheme.warning, Icons.inventory_rounded, 'Picked up', 'Load is on board'),
      'in_transit' => (AppTheme.primary, Icons.local_shipping_rounded, 'In transit', 'On the way to delivery'),
      'delivered' => (AppTheme.success, Icons.task_alt_rounded, 'Delivered', 'Trip complete'),
      'cancelled' => (AppTheme.danger, Icons.cancel_rounded, 'Cancelled', 'Booking cancelled'),
      _ => (AppTheme.muted, Icons.help_outline_rounded, status, ''),
    };
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.w800, color: color, fontSize: 16)),
            if (subtitle.isNotEmpty)
              Text(subtitle, style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
          ]),
        ),
      ]),
    );
  }
}
