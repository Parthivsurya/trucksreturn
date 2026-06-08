import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/api/shipper_api.dart';
import '../../core/cities.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/city_picker.dart';

class PostLoadScreen extends StatefulWidget {
  const PostLoadScreen({super.key});

  @override
  State<PostLoadScreen> createState() => _PostLoadScreenState();
}

class _PostLoadScreenState extends State<PostLoadScreen> {
  final _form = GlobalKey<FormState>();
  City? _pickup;
  City? _delivery;
  String? _cargoType;
  final _weight = TextEditingController();
  final _price = TextEditingController();
  final _pickupAddr = TextEditingController();
  final _deliveryAddr = TextEditingController();
  final _description = TextEditingController();
  bool _saving = false;

  static const _cargoTypes = [
    'General goods', 'Electronics', 'Furniture', 'Food & beverages',
    'Construction materials', 'Textile & clothing', 'Auto parts',
    'Chemicals', 'Agricultural produce', 'Other',
  ];

  @override
  void initState() {
    super.initState();
    CityRepo.instance.load();
  }

  @override
  void dispose() {
    _weight.dispose();
    _price.dispose();
    _pickupAddr.dispose();
    _deliveryAddr.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_pickup == null || _delivery == null) {
      showError(context, 'Pick pickup and delivery cities');
      return;
    }
    if (_pickup!.name == _delivery!.name) {
      showError(context, 'Pickup and delivery must differ');
      return;
    }
    if (_cargoType == null) {
      showError(context, 'Choose cargo type');
      return;
    }
    setState(() => _saving = true);
    try {
      await ShipperApi.createLoad(
        pickupLat: _pickup!.lat,
        pickupLng: _pickup!.lng,
        deliveryLat: _delivery!.lat,
        deliveryLng: _delivery!.lng,
        pickupCity: _pickup!.name,
        deliveryCity: _delivery!.name,
        pickupAddress: _pickupAddr.text,
        deliveryAddress: _deliveryAddr.text,
        cargoType: _cargoType!,
        weightTons: double.parse(_weight.text),
        offeredPrice: double.parse(_price.text),
        description: _description.text,
      );
      if (!mounted) return;
      showSuccess(context, 'Load posted. Finding trucks...');
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post a load')),
      body: SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              const Text('Route', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.muted)),
              const SizedBox(height: 10),
              CityField(
                label: 'Pickup city',
                icon: Icons.my_location_rounded,
                value: _pickup,
                onChanged: (c) => setState(() => _pickup = c),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _pickupAddr,
                decoration: const InputDecoration(
                  labelText: 'Pickup address',
                  prefixIcon: Icon(Icons.location_on_outlined, color: AppTheme.muted),
                ),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Pickup address required' : null,
              ),
              const SizedBox(height: 18),
              CityField(
                label: 'Delivery city',
                icon: Icons.location_on_rounded,
                value: _delivery,
                onChanged: (c) => setState(() => _delivery = c),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _deliveryAddr,
                decoration: const InputDecoration(
                  labelText: 'Delivery address (optional)',
                  prefixIcon: Icon(Icons.location_on_outlined, color: AppTheme.muted),
                ),
              ),
              const SizedBox(height: 22),
              const Text('Cargo', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.muted)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: _cargoTypes.map((t) {
                  final selected = _cargoType == t;
                  return ChoiceChip(
                    label: Text(t),
                    selected: selected,
                    onSelected: (_) => setState(() => _cargoType = t),
                    selectedColor: AppTheme.primary.withValues(alpha: 0.15),
                    labelStyle: TextStyle(
                      color: selected ? AppTheme.primary : AppTheme.text,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    side: BorderSide(color: selected ? AppTheme.primary : AppTheme.border),
                  );
                }).toList(),
              ),
              const SizedBox(height: 18),
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _weight,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Weight (tons)',
                      prefixIcon: Icon(Icons.scale_rounded, color: AppTheme.muted),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      final n = double.tryParse(v);
                      if (n == null || n <= 0) return 'Invalid';
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _price,
                    keyboardType: const TextInputType.numberWithOptions(decimal: false),
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(
                      labelText: 'Offered ₹',
                      prefixIcon: Icon(Icons.currency_rupee_rounded, color: AppTheme.muted),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      final n = double.tryParse(v);
                      if (n == null || n <= 0) return 'Invalid';
                      return null;
                    },
                  ),
                ),
              ]),
              const SizedBox(height: 14),
              TextFormField(
                controller: _description,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Notes (optional)',
                  hintText: 'Handling instructions, contact details, etc.',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 28),
              PrimaryButton(
                label: 'Post load',
                icon: Icons.send_rounded,
                loading: _saving,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
