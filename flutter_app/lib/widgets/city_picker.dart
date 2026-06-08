import 'package:flutter/material.dart';
import '../core/cities.dart';
import '../core/theme.dart';

class CityField extends StatelessWidget {
  final String label;
  final City? value;
  final ValueChanged<City> onChanged;
  final IconData icon;
  const CityField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.icon = Icons.location_on_outlined,
  });

  Future<void> _open(BuildContext context) async {
    final picked = await showModalBottomSheet<City>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => const _CityPickerSheet(),
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _open(context),
      borderRadius: BorderRadius.circular(14),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: AppTheme.muted),
          suffixIcon: const Icon(Icons.expand_more_rounded, color: AppTheme.muted),
        ),
        child: Text(
          value == null ? 'Select a city' : value!.label,
          style: TextStyle(
            fontSize: 15,
            color: value == null ? AppTheme.muted : AppTheme.text,
            fontWeight: value == null ? FontWeight.w400 : FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _CityPickerSheet extends StatefulWidget {
  const _CityPickerSheet();

  @override
  State<_CityPickerSheet> createState() => _CityPickerSheetState();
}

class _CityPickerSheetState extends State<_CityPickerSheet> {
  final _q = TextEditingController();
  List<City> _results = const [];

  @override
  void initState() {
    super.initState();
    _results = CityRepo.instance.search('');
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: size.height * 0.85,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Choose a city',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _q,
                    autofocus: true,
                    decoration: const InputDecoration(
                      hintText: 'Search city or state',
                      prefixIcon: Icon(Icons.search_rounded, color: AppTheme.muted),
                    ),
                    onChanged: (s) => setState(() => _results = CityRepo.instance.search(s)),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView.separated(
                itemCount: _results.length,
                separatorBuilder: (_, _) => const Divider(height: 1, indent: 56),
                itemBuilder: (_, i) {
                  final c = _results[i];
                  return ListTile(
                    leading: Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.location_city_rounded,
                          color: AppTheme.primary, size: 20),
                    ),
                    title: Text(c.name,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(c.state,
                        style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
                    onTap: () => Navigator.pop(context, c),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
