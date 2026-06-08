import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';

class DriverProfileTab extends StatelessWidget {
  const DriverProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          const Text('Profile',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(children: [
              Container(
                width: 60, height: 60,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                alignment: Alignment.center,
                child: Text(
                  (user?.name.isNotEmpty == true ? user!.name[0] : '?').toUpperCase(),
                  style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.primary),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user?.name ?? '',
                        style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(user?.email ?? '',
                        style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
                    if (user?.phone != null) ...[
                      const SizedBox(height: 2),
                      Text(user!.phone!,
                          style: const TextStyle(color: AppTheme.muted, fontSize: 13)),
                    ],
                  ],
                ),
              ),
            ]),
          ),
          const SizedBox(height: 20),
          _MenuItem(icon: Icons.local_shipping_rounded, label: 'Truck details', onTap: () {}),
          _MenuItem(icon: Icons.verified_user_rounded, label: 'Verification', onTap: () {}),
          _MenuItem(icon: Icons.notifications_outlined, label: 'Notifications', onTap: () {}),
          _MenuItem(icon: Icons.help_outline_rounded, label: 'Help & support', onTap: () {}),
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: auth.logout,
            icon: const Icon(Icons.logout_rounded, color: AppTheme.danger),
            label: const Text('Log out', style: TextStyle(color: AppTheme.danger)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppTheme.danger),
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _MenuItem({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: AppTheme.bg, borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppTheme.text, size: 20),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right_rounded, color: AppTheme.muted),
        onTap: onTap,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppTheme.border),
        ),
        tileColor: Colors.white,
      ),
    );
  }
}
