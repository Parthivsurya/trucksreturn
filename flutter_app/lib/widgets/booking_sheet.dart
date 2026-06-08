import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../core/api/booking_api.dart';
import '../core/theme.dart';
import 'app_button.dart';

class AcceptLoadSheet extends StatefulWidget {
  final Map<String, dynamic> match;
  const AcceptLoadSheet({super.key, required this.match});

  static Future<bool?> show(BuildContext context, Map<String, dynamic> match) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => AcceptLoadSheet(match: match),
    );
  }

  @override
  State<AcceptLoadSheet> createState() => _AcceptLoadSheetState();
}

class _AcceptLoadSheetState extends State<AcceptLoadSheet> {
  late final TextEditingController _price;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final offered = widget.match['offered_price'];
    _price = TextEditingController(
      text: offered is num ? offered.toStringAsFixed(0) : '',
    );
  }

  @override
  void dispose() {
    _price.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final loadId = widget.match['id'] ?? widget.match['load_id'];
    if (loadId is! int) {
      showError(context, 'Invalid load reference');
      return;
    }
    final p = double.tryParse(_price.text);
    if (p == null || p <= 0) {
      showError(context, 'Enter a valid price');
      return;
    }
    setState(() => _loading = true);
    try {
      await BookingApi.create(loadId: loadId, agreedPrice: p);
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.match;
    final money = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final offered = m['offered_price'] is num ? money.format(m['offered_price']) : '—';

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text('Accept this load?',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.bg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(children: [
                  Row(children: [
                    const Icon(Icons.my_location_rounded, color: AppTheme.success, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(m['pickup_city']?.toString() ?? '',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.location_on_rounded, color: AppTheme.danger, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(m['delivery_city']?.toString() ?? '',
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ]),
                  if (m['weight_tons'] != null || m['cargo_type'] != null) ...[
                    const SizedBox(height: 10),
                    const Divider(height: 1),
                    const SizedBox(height: 10),
                    Row(children: [
                      if (m['weight_tons'] != null) ...[
                        const Icon(Icons.scale_rounded, size: 14, color: AppTheme.muted),
                        const SizedBox(width: 4),
                        Text('${m['weight_tons']} t',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(width: 14),
                      ],
                      if (m['cargo_type'] != null) ...[
                        const Icon(Icons.inventory_2_outlined, size: 14, color: AppTheme.muted),
                        const SizedBox(width: 4),
                        Text(m['cargo_type'].toString(),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ]),
                  ],
                ]),
              ),
              const SizedBox(height: 20),
              Row(children: [
                const Text('Shipper offered: ', style: TextStyle(color: AppTheme.muted)),
                Text(offered, style: const TextStyle(fontWeight: FontWeight.w700)),
              ]),
              const SizedBox(height: 10),
              TextField(
                controller: _price,
                keyboardType: const TextInputType.numberWithOptions(decimal: false),
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  labelText: 'Your agreed price (₹)',
                  prefixIcon: Icon(Icons.currency_rupee_rounded, color: AppTheme.muted),
                ),
              ),
              const SizedBox(height: 20),
              PrimaryButton(
                label: 'Confirm booking',
                icon: Icons.check_circle_rounded,
                loading: _loading,
                onPressed: _confirm,
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _loading ? null : () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
