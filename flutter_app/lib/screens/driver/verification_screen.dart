import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api/upload_api.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _DocSpec {
  final String type;
  final String label;
  final String hint;
  final IconData icon;
  final bool required;
  const _DocSpec(this.type, this.label, this.hint, this.icon, {this.required = true});
}

class _VerificationScreenState extends State<VerificationScreen> {
  static const _docs = [
    _DocSpec('licence', 'Driving licence', 'Front side, clear text', Icons.badge_rounded),
    _DocSpec('RC', 'RC book', 'Vehicle registration certificate', Icons.assignment_rounded),
    _DocSpec('insurance', 'Insurance', 'Active policy document', Icons.shield_rounded),
    _DocSpec('permit', 'Permit', 'Goods permit (state/national)', Icons.directions_rounded, required: false),
    _DocSpec('PUC', 'PUC', 'Pollution under control certificate', Icons.eco_rounded, required: false),
    _DocSpec('vehicle_front', 'Truck front photo', 'With number plate visible', Icons.photo_camera_rounded),
    _DocSpec('vehicle_left', 'Truck left side', '', Icons.photo_camera_rounded, required: false),
    _DocSpec('vehicle_right', 'Truck right side', '', Icons.photo_camera_rounded, required: false),
  ];

  Map<String, List<Map<String, dynamic>>> _docsByType = {};
  bool _loading = true;
  bool _submitting = false;
  final Set<String> _uploading = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final docs = await UploadApi.getMyDocuments();
      final grouped = <String, List<Map<String, dynamic>>>{};
      for (final d in docs) {
        final t = d['doc_type']?.toString();
        if (t == null) continue;
        (grouped[t] ??= []).add(d);
      }
      if (!mounted) return;
      setState(() {
        _docsByType = grouped;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      showError(context, e.toString());
    }
  }

  Future<void> _pickAndUpload(_DocSpec spec) async {
    final source = await _pickSource(spec);
    if (source == null) return;
    String? path;
    try {
      if (source == _Source.camera) {
        final x = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 85);
        path = x?.path;
      } else {
        final x = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
        path = x?.path;
      }
    } catch (e) {
      if (mounted) showError(context, e.toString());
      return;
    }
    if (path == null) return;
    setState(() => _uploading.add(spec.type));
    try {
      await UploadApi.uploadDocument(filePath: path, docType: spec.type);
      if (!mounted) return;
      showSuccess(context, '${spec.label} uploaded');
      await _load();
    } catch (e) {
      if (mounted) showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _uploading.remove(spec.type));
    }
  }

  Future<_Source?> _pickSource(_DocSpec spec) async {
    return showModalBottomSheet<_Source>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        top: false,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const SizedBox(height: 14),
          Container(
            width: 36, height: 4,
            decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 14),
          ListTile(
            leading: const Icon(Icons.photo_camera_rounded, color: AppTheme.primary),
            title: const Text('Take photo'),
            onTap: () => Navigator.pop(context, _Source.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_rounded, color: AppTheme.primary),
            title: const Text('Choose from gallery'),
            onTap: () => Navigator.pop(context, _Source.gallery),
          ),
          const SizedBox(height: 6),
        ]),
      ),
    );
  }

  Future<void> _submit() async {
    final missing = _docs
        .where((d) => d.required && (_docsByType[d.type]?.isEmpty ?? true))
        .map((d) => d.label)
        .toList();
    if (missing.isNotEmpty) {
      showError(context, 'Missing: ${missing.join(", ")}');
      return;
    }
    setState(() => _submitting = true);
    try {
      final msg = await UploadApi.submitForVerification();
      if (!mounted) return;
      showSuccess(context, msg);
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verification')),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.25)),
                      ),
                      child: const Row(children: [
                        Icon(Icons.info_rounded, color: AppTheme.primary),
                        SizedBox(width: 10),
                        Expanded(child: Text(
                          'Upload your driving licence, RC, insurance and one truck photo to get verified. JPG or PNG up to 5 MB.',
                          style: TextStyle(fontSize: 13),
                        )),
                      ]),
                    ),
                    const SizedBox(height: 18),
                    ..._docs.map((spec) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: _DocCard(
                            spec: spec,
                            uploaded: _docsByType[spec.type] ?? const [],
                            uploading: _uploading.contains(spec.type),
                            onTap: () => _pickAndUpload(spec),
                          ),
                        )),
                    const SizedBox(height: 20),
                    PrimaryButton(
                      label: 'Submit for verification',
                      icon: Icons.verified_rounded,
                      loading: _submitting,
                      onPressed: _submit,
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

enum _Source { camera, gallery }

class _DocCard extends StatelessWidget {
  final _DocSpec spec;
  final List<Map<String, dynamic>> uploaded;
  final bool uploading;
  final VoidCallback onTap;
  const _DocCard({
    required this.spec,
    required this.uploaded,
    required this.uploading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final has = uploaded.isNotEmpty;
    return InkWell(
      onTap: uploading ? null : onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: has ? AppTheme.success : AppTheme.border, width: has ? 1.4 : 1),
        ),
        child: Row(children: [
          Container(
            width: 42, height: 42,
            decoration: BoxDecoration(
              color: (has ? AppTheme.success : AppTheme.primary).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Icon(has ? Icons.check_circle_rounded : spec.icon,
                color: has ? AppTheme.success : AppTheme.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(
                    child: Text(spec.label,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  ),
                  if (spec.required && !has)
                    const Padding(
                      padding: EdgeInsets.only(left: 6),
                      child: Text('Required',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.danger)),
                    ),
                ]),
                const SizedBox(height: 2),
                Text(
                  has
                      ? '${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded'
                      : (spec.hint.isEmpty ? 'Tap to upload' : spec.hint),
                  style: const TextStyle(color: AppTheme.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          if (uploading)
            const SizedBox(
              width: 22, height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.4, color: AppTheme.primary),
            )
          else
            Icon(has ? Icons.refresh_rounded : Icons.upload_rounded, color: AppTheme.muted, size: 20),
        ]),
      ),
    );
  }
}
