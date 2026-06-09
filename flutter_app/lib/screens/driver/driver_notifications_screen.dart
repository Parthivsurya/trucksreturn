import 'package:flutter/material.dart';
import '../../core/theme.dart';

class DriverNotificationsScreen extends StatefulWidget {
  const DriverNotificationsScreen({super.key});

  @override
  State<DriverNotificationsScreen> createState() => _DriverNotificationsScreenState();
}

class _DriverNotificationsScreenState extends State<DriverNotificationsScreen> {
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': '1',
      'title': 'New Match Found',
      'body': 'A new load matching your route is available from Kochi to Coimbatore (₹18,500, 7.5 t).',
      'time': '10m ago',
      'type': 'match',
      'isRead': false,
    },
    {
      'id': '2',
      'title': 'Booking Confirmed',
      'body': 'Shipper "Sree Textiles" has confirmed your booking Kochi → Bangalore for tomorrow.',
      'time': '2h ago',
      'type': 'booking',
      'isRead': false,
    },
    {
      'id': '3',
      'title': 'Truck Profile Approved',
      'body': 'Your truck MH-12-QW-9876 has been successfully verified by our onboarding team.',
      'time': '1d ago',
      'type': 'system',
      'isRead': true,
    },
    {
      'id': '4',
      'title': 'Payment Released',
      'body': 'Payment of ₹24,000 for booking #8843 (Bangalore → Kochi) has been disbursed to your account.',
      'time': '2d ago',
      'type': 'payment',
      'isRead': true,
    },
  ];

  void _markAllAsRead() {
    setState(() {
      for (var n in _notifications) {
        n['isRead'] = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read'),
        backgroundColor: AppTheme.success,
        duration: Duration(seconds: 1),
      ),
    );
  }

  void _toggleRead(int idx) {
    setState(() {
      _notifications[idx]['isRead'] = !_notifications[idx]['isRead'];
    });
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'match':
        return Icons.route_rounded;
      case 'booking':
        return Icons.check_circle_outline_rounded;
      case 'payment':
        return Icons.account_balance_wallet_outlined;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  Color _getIconColor(String type) {
    switch (type) {
      case 'match':
        return AppTheme.primary;
      case 'booking':
        return AppTheme.primaryDark;
      case 'payment':
        return Colors.green;
      default:
        return AppTheme.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = _notifications.any((n) => !n['isRead']);

    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.text),
        ),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text(
                'Mark all read',
                style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: AppTheme.border, height: 1),
        ),
      ),
      body: _notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Icon(Icons.notifications_off_outlined, size: 48, color: AppTheme.muted),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'No notifications yet',
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.text, fontSize: 16),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'We will notify you about matches and bookings.',
                    style: TextStyle(color: AppTheme.muted, fontSize: 13),
                  ),
                ],
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 12),
              itemCount: _notifications.length,
              separatorBuilder: (_, _) => const SizedBox(height: 1),
              itemBuilder: (context, idx) {
                final n = _notifications[idx];
                final isRead = n['isRead'] as bool;

                return InkWell(
                  onTap: () => _toggleRead(idx),
                  child: Container(
                    color: isRead ? Colors.transparent : AppTheme.surface,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Unread Dot indicator
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 6, right: 12),
                          decoration: BoxDecoration(
                            color: isRead ? Colors.transparent : AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        // Category Icon
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: isRead ? AppTheme.surface : AppTheme.bg,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Icon(_getIcon(n['type']), color: _getIconColor(n['type']), size: 20),
                        ),
                        const SizedBox(width: 14),
                        // Content
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      n['title'],
                                      style: TextStyle(
                                        fontSize: 14.5,
                                        fontWeight: isRead ? FontWeight.bold : FontWeight.w900,
                                        color: isRead ? AppTheme.ink2 : AppTheme.text,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    n['time'],
                                    style: const TextStyle(fontSize: 11, color: AppTheme.muted),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                n['body'],
                                style: TextStyle(
                                  fontSize: 13,
                                  color: isRead ? AppTheme.muted : AppTheme.ink2,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
