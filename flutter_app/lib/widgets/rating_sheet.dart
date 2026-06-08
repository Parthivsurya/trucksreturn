import 'package:flutter/material.dart';
import '../core/api/booking_api.dart';
import '../core/theme.dart';
import 'app_button.dart';

class RatingSheet extends StatefulWidget {
  final String uuid;
  final String counterpartyName;
  final String counterpartyRole;
  const RatingSheet({
    super.key,
    required this.uuid,
    required this.counterpartyName,
    required this.counterpartyRole,
  });

  @override
  State<RatingSheet> createState() => _RatingSheetState();
}

class _RatingSheetState extends State<RatingSheet> {
  int _score = 5;
  final _comment = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _saving = true);
    try {
      await BookingApi.rate(widget.uuid, score: _score, comment: _comment.text);
      if (!mounted) return;
      Navigator.pop(context, true);
      showSuccess(context, 'Thanks for rating ${widget.counterpartyName}');
    } catch (e) {
      if (!mounted) return;
      showError(context, e.toString());
      setState(() => _saving = false);
    }
  }

  String get _label => switch (_score) {
        1 => 'Poor',
        2 => 'Below average',
        3 => 'Okay',
        4 => 'Good',
        _ => 'Excellent',
      };

  @override
  Widget build(BuildContext context) {
    final inset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: inset),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: AppTheme.border, borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 18),
            Text('Rate your ${widget.counterpartyRole}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(widget.counterpartyName,
                style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
            const SizedBox(height: 22),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final filled = i < _score;
                return GestureDetector(
                  onTap: () => setState(() => _score = i + 1),
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      filled ? Icons.star_rounded : Icons.star_outline_rounded,
                      size: 44,
                      color: filled ? AppTheme.warning : AppTheme.muted,
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 6),
            Text(_label,
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.text)),
            const SizedBox(height: 18),
            TextField(
              controller: _comment,
              maxLines: 3,
              maxLength: 280,
              decoration: const InputDecoration(
                labelText: 'Add a note (optional)',
                hintText: 'On time, professional, easy to work with…',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            PrimaryButton(
              label: 'Submit rating',
              icon: Icons.send_rounded,
              loading: _saving,
              onPressed: _submit,
            ),
          ]),
        ),
      ),
    );
  }
}

Future<bool> showRatingSheet(
  BuildContext context, {
  required String uuid,
  required String counterpartyName,
  required String counterpartyRole,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => RatingSheet(
      uuid: uuid,
      counterpartyName: counterpartyName,
      counterpartyRole: counterpartyRole,
    ),
  );
  return result == true;
}
