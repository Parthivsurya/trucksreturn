import 'package:flutter/material.dart';
import '../../core/theme.dart';

class DriverHelpSupportScreen extends StatelessWidget {
  const DriverHelpSupportScreen({super.key});

  final List<Map<String, String>> _faqs = const [
    {
      'question': 'How does the route matching algorithm work?',
      'answer': 'Our system calculates matching scores based on your current location and destination. It identifies loads within a 50 km pickup radius and checks if the delivery is along your route (max 40% detour allowed). Loads are ranked by pickup closeness, detour, and offered price.',
    },
    {
      'question': 'How long does document verification take?',
      'answer': 'Typically, verification of your driver licence, RC, and insurance takes 2 to 4 hours. You will receive a notification and a verified badge on your profile as soon as it is approved.',
    },
    {
      'question': 'What is the difference between Full and LTL capacity?',
      'answer': 'Full Truck Load (FTL) matches you with single shipper cargo that utilizes your entire capacity. Less Than Truckload (LTL) allows you to pick up multiple partial shipments along your route to maximize earnings.',
    },
    {
      'question': 'How are payments handled?',
      'answer': 'Agreed prices are settled directly between you and the shipper. You can confirm transit updates on the active trip screen so shippers can prepare and release payments on delivery.',
    },
  ];

  void _contactSupport(BuildContext context, String method, String details) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening $method: $details...'),
        backgroundColor: AppTheme.primaryDark,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Help & support',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.text),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'How can we help you?',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.text),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Contact our support desk or browse frequently asked questions below.',
                  style: TextStyle(color: AppTheme.muted, fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Contact Methods Grid/Row
          const Text(
            'Support Channels',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink2),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _SupportChannelCard(
                  icon: Icons.phone_rounded,
                  label: 'Call Helpline',
                  sublabel: '24/7 Support',
                  onTap: () => _contactSupport(context, 'Dialer', '+91 90374 07267'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _SupportChannelCard(
                  icon: Icons.email_rounded,
                  label: 'Email Support',
                  sublabel: 'Quick response',
                  onTap: () => _contactSupport(context, 'Mail client', 'support@trucksreturn.com'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // FAQs Section
          const Text(
            'Frequently Asked Questions',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink2),
          ),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              children: List.generate(_faqs.length, (idx) {
                final faq = _faqs[idx];
                final isLast = idx == _faqs.length - 1;

                return Column(
                  children: [
                    Theme(
                      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
                      child: ExpansionTile(
                        iconColor: AppTheme.primary,
                        collapsedIconColor: AppTheme.muted,
                        title: Text(
                          faq['question']!,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.text,
                          ),
                        ),
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                            child: Text(
                              faq['answer']!,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.muted,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (!isLast) Container(height: 1, color: AppTheme.border),
                  ],
                );
              }),
            ),
          ),
          const SizedBox(height: 30),
          
          // App version disclaimer
          const Center(
            child: Text(
              'ReturnLoad · v1.0.0 (Production Build)',
              style: TextStyle(fontSize: 11, color: AppTheme.muted),
            ),
          ),
        ],
      ),
    );
  }
}

class _SupportChannelCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sublabel;
  final VoidCallback onTap;

  const _SupportChannelCard({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.accentWeak,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.text),
            ),
            const SizedBox(height: 2),
            Text(
              sublabel,
              style: const TextStyle(fontSize: 11, color: AppTheme.muted),
            ),
          ],
        ),
      ),
    );
  }
}
