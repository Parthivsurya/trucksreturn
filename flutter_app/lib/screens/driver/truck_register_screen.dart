import 'package:flutter/material.dart';
import '../../core/api/driver_api.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';

class TruckRegisterScreen extends StatefulWidget {
  const TruckRegisterScreen({super.key});

  @override
  State<TruckRegisterScreen> createState() => _TruckRegisterScreenState();
}

class _TruckRegisterScreenState extends State<TruckRegisterScreen> {
  final _form = GlobalKey<FormState>();
  String? _truckType;
  final _capacity = TextEditingController();
  final _permit = TextEditingController();
  final _homeState = TextEditingController();
  final _regNum = TextEditingController();
  bool _saving = false;
  bool _loading = true;
  bool _isEdit = false;

  static const _types = [
    'Open Body', 'Closed Container', 'Trailer', 'Mini Truck',
    'Tipper', 'Tanker', 'Refrigerated', 'Flatbed',
  ];

  @override
  void initState() {
    super.initState();
    _loadExisting();
  }

  Future<void> _loadExisting() async {
    final existing = await DriverApi.getTruck();
    if (!mounted) return;
    if (existing != null) {
      _isEdit = true;
      _truckType = existing['truck_type']?.toString();
      _capacity.text = existing['capacity_tons']?.toString() ?? '';
      _regNum.text = existing['registration_number']?.toString() ?? '';
      _permit.text = existing['permit_number']?.toString() ?? '';
      _homeState.text = existing['home_state']?.toString() ?? '';
    }
    setState(() => _loading = false);
  }

  @override
  void dispose() {
    _capacity.dispose();
    _permit.dispose();
    _homeState.dispose();
    _regNum.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    if (_truckType == null) {
      showError(context, 'Please pick a truck type');
      return;
    }
    setState(() => _saving = true);
    try {
      await DriverApi.registerTruck(
        truckType: _truckType!,
        capacityTons: double.parse(_capacity.text),
        permitNumber: _permit.text,
        homeState: _homeState.text,
        registrationNumber: _regNum.text,
      );
      if (!mounted) return;
      showSuccess(context, _isEdit ? 'Truck updated.' : 'Truck saved. Awaiting verification.');
      Navigator.pop(context);
    } catch (e) {
      if (mounted) showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'My truck' : 'Register truck')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : SafeArea(
        child: Form(
          key: _form,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            children: [
              const Text('Truck type', style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.muted)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: _types.map((t) {
                  final selected = _truckType == t;
                  return ChoiceChip(
                    label: Text(t),
                    selected: selected,
                    onSelected: (_) => setState(() => _truckType = t),
                    selectedColor: AppTheme.primary.withValues(alpha: 0.15),
                    labelStyle: TextStyle(
                      color: selected ? AppTheme.primary : AppTheme.text,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    ),
                    side: BorderSide(color: selected ? AppTheme.primary : AppTheme.border),
                  );
                }).toList(),
              ),
              const SizedBox(height: 22),
              TextFormField(
                controller: _capacity,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: 'Capacity (tons)',
                  prefixIcon: Icon(Icons.scale_rounded, color: AppTheme.muted),
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Capacity is required';
                  final n = double.tryParse(v);
                  if (n == null || n <= 0) return 'Enter a positive number';
                  return null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _regNum,
                decoration: const InputDecoration(
                  labelText: 'Registration number (optional)',
                  prefixIcon: Icon(Icons.badge_outlined, color: AppTheme.muted),
                ),
                textCapitalization: TextCapitalization.characters,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _permit,
                decoration: const InputDecoration(
                  labelText: 'Permit number (optional)',
                  prefixIcon: Icon(Icons.description_outlined, color: AppTheme.muted),
                ),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _homeState,
                decoration: const InputDecoration(
                  labelText: 'Home state (optional)',
                  prefixIcon: Icon(Icons.location_on_outlined, color: AppTheme.muted),
                ),
                textCapitalization: TextCapitalization.words,
              ),
              const SizedBox(height: 28),
              PrimaryButton(label: _isEdit ? 'Update truck' : 'Save truck', loading: _saving, onPressed: _save),
            ],
          ),
        ),
      ),
    );
  }
}
