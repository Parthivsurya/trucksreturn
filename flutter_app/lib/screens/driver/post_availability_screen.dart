import 'package:flutter/material.dart';
import '../../core/api/driver_api.dart';
import '../../core/cities.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';
import '../../widgets/city_picker.dart';

class PostAvailabilityScreen extends StatefulWidget {
  const PostAvailabilityScreen({super.key});

  @override
  State<PostAvailabilityScreen> createState() => _PostAvailabilityScreenState();
}

class _PostAvailabilityScreenState extends State<PostAvailabilityScreen> {
  City? _from;
  City? _to;
  final _capacity = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _capacity.dispose();
    super.dispose();
  }

  Future<void> _post() async {
    if (_from == null || _to == null) {
      showError(context, 'Pick both current and destination city');
      return;
    }
    if (_from!.name == _to!.name) {
      showError(context, 'Origin and destination must differ');
      return;
    }
    setState(() => _saving = true);
    try {
      double? cap;
      if (_capacity.text.isNotEmpty) {
        cap = double.tryParse(_capacity.text);
        if (cap == null || cap <= 0) {
          showError(context, 'Invalid capacity');
          setState(() => _saving = false);
          return;
        }
      }
      await DriverApi.broadcastAvailability(
        currentLat: _from!.lat,
        currentLng: _from!.lng,
        destLat: _to!.lat,
        destLng: _to!.lng,
        currentCity: _from!.name,
        destinationCity: _to!.name,
        availableCapacityTons: cap,
      );
      if (!mounted) return;
      showSuccess(context, 'Route posted. Finding loads...');
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
      appBar: AppBar(title: const Text('Post return route')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            const Text('Where are you now and where are you headed?',
                style: TextStyle(fontSize: 16, color: AppTheme.muted)),
            const SizedBox(height: 22),
            CityField(
              label: 'Current city',
              icon: Icons.my_location_rounded,
              value: _from,
              onChanged: (c) => setState(() => _from = c),
            ),
            const SizedBox(height: 14),
            CityField(
              label: 'Destination city',
              icon: Icons.location_on_rounded,
              value: _to,
              onChanged: (c) => setState(() => _to = c),
            ),
            const SizedBox(height: 22),
            TextFormField(
              controller: _capacity,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Partial capacity available (tons) — optional',
                helperText: 'Leave empty for full truck',
                prefixIcon: Icon(Icons.scale_rounded, color: AppTheme.muted),
              ),
            ),
            const SizedBox(height: 28),
            PrimaryButton(label: 'Post route', loading: _saving, onPressed: _post),
          ],
        ),
      ),
    );
  }
}
