import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 26.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 34),
                    // Logo
                    Container(
                      width: 62,
                      height: 62,
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.5),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          )
                        ],
                      ),
                      child: const Icon(
                        Icons.local_shipping_rounded,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Wordmark
                    RichText(
                      text: const TextSpan(
                        style: TextStyle(
                          fontSize: 27,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.text,
                          fontFamily: 'Roboto',
                          letterSpacing: -0.5,
                        ),
                        children: [
                          TextSpan(text: 'Return'),
                          TextSpan(
                            text: 'Load',
                            style: TextStyle(color: AppTheme.primary),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Tagline
                    const SizedBox(
                      width: 260,
                      child: Text(
                        'Turn the empty trip home into a paid load.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: AppTheme.ink2,
                          fontSize: 14.5,
                          height: 1.5,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ),
                    const SizedBox(height: 26),
                    // Hero Art Painter
                    SizedBox(
                      width: double.infinity,
                      height: 120,
                      child: CustomPaint(
                        painter: CorridorArtPainter(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Feature List
                    _FeatureTile(
                      icon: Icons.location_on_rounded,
                      title: 'Loads along your way',
                      subtitle: 'Pickups anywhere on your return corridor',
                    ),
                    const SizedBox(height: 11),
                    _FeatureTile(
                      icon: Icons.trending_up_rounded,
                      title: 'Earn on the empty leg',
                      subtitle: "No more driving home with an empty truck",
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            // Footer
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
              child: Column(
                children: [
                  FilledButton(
                    onPressed: () => context.go('/role'),
                    child: const Text('Get started'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => context.go('/login?role=driver'),
                    child: const Text('I already have an account'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15.0, vertical: 13.0),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(34, 40, 49, 0.06),
            blurRadius: 3,
            offset: Offset(0, 1),
          ),
          BoxShadow(
            color: Color.fromRGBO(34, 40, 49, 0.1),
            blurRadius: 2,
            offset: Offset(0, 1),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: AppTheme.accentWeak,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              color: AppTheme.primaryDark,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.text,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: AppTheme.muted,
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class CorridorArtPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final width = size.width;

    // Draw route dashed line
    final path = Path();
    path.moveTo(24, 96);
    path.cubicTo(
      width * 0.3, 96,
      width * 0.35, 30,
      width * 0.53, 30,
    );
    path.cubicTo(
      width * 0.8, 30,
      width * 0.8, 70,
      width - 24, 24,
    );

    final linePaint = Paint()
      ..color = AppTheme.accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    // Drawing dashed curve
    final pathMetrics = path.computeMetrics();
    for (final metric in pathMetrics) {
      double distance = 0.0;
      bool draw = true;
      while (distance < metric.length) {
        final length = draw ? 2.0 : 9.0;
        if (draw) {
          final extract = metric.extractPath(distance, distance + length);
          canvas.drawPath(extract, linePaint);
        }
        distance += length;
        draw = !draw;
      }
    }

    // Origin Node
    final originPaint = Paint()..color = AppTheme.accent;
    canvas.drawCircle(const Offset(24, 96), 7, originPaint);
    _drawText(canvas, 'Origin', const Offset(24, 106), TextAlign.center);

    // Destination Node (Flag symbol mockup representation)
    final destPaint = Paint()
      ..color = AppTheme.muted
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5;
    canvas.drawLine(Offset(width - 24, 22), Offset(width - 24, 36), destPaint);
    
    final flagPath = Path()
      ..moveTo(width - 24, 23)
      ..lineTo(width - 15, 23)
      ..lineTo(width - 17.5, 26.5)
      ..lineTo(width - 15, 30)
      ..lineTo(width - 24, 30)
      ..close();
    canvas.drawPath(flagPath, Paint()..color = AppTheme.muted);
    _drawText(canvas, 'Home', Offset(width - 24, 106), TextAlign.center);

    // Pickup point along the way
    final pickupPoint = Offset(width * 0.53, 30);
    // Draw white background circle with primary border
    final pickupBgPaint = Paint()..color = Colors.white;
    final pickupBorderPaint = Paint()
      ..color = AppTheme.accent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawCircle(pickupPoint, 9, pickupBgPaint);
    canvas.drawCircle(pickupPoint, 9, pickupBorderPaint);

    // Plus inside circle
    final plusPaint = Paint()
      ..color = AppTheme.accent
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(pickupPoint.dx, pickupPoint.dy - 4), Offset(pickupPoint.dx, pickupPoint.dy + 4), plusPaint);
    canvas.drawLine(Offset(pickupPoint.dx - 4, pickupPoint.dy), Offset(pickupPoint.dx + 4, pickupPoint.dy), plusPaint);

    _drawText(canvas, 'Pickup on route', Offset(pickupPoint.dx, 4), TextAlign.center, isAccent: true);
  }

  void _drawText(Canvas canvas, String text, Offset offset, TextAlign align, {bool isAccent = false}) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: isAccent ? AppTheme.primaryDark : AppTheme.muted,
          fontSize: 10,
          fontWeight: isAccent ? FontWeight.bold : FontWeight.normal,
          fontFamily: 'Roboto',
        ),
      ),
      textDirection: TextDirection.ltr,
      textAlign: align,
    );
    textPainter.layout();
    
    double dx = offset.dx;
    if (align == TextAlign.center) {
      dx -= textPainter.width / 2;
    } else if (align == TextAlign.right) {
      dx -= textPainter.width;
    }
    
    textPainter.paint(canvas, Offset(dx, offset.dy));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
