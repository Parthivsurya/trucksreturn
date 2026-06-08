import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class RoleSelectScreen extends StatelessWidget {
  const RoleSelectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Row(children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 12),
                const Text('TrucksReturn',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              ]),
              const SizedBox(height: 56),
              const Text('Welcome', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
              const SizedBox(height: 8),
              const Text('Choose how you want to get started',
                  style: TextStyle(fontSize: 16, color: AppTheme.muted)),
              const SizedBox(height: 40),
              _RoleCard(
                icon: Icons.local_shipping_rounded,
                title: 'I drive a truck',
                subtitle: 'Find return loads on your route',
                onTap: () => context.go('/login?role=driver'),
              ),
              const SizedBox(height: 16),
              _RoleCard(
                icon: Icons.inventory_2_rounded,
                title: 'I ship goods',
                subtitle: 'Post loads and find trucks',
                onTap: () => context.go('/login?role=shipper'),
              ),
              const Spacer(),
              Center(
                child: TextButton(
                  onPressed: () => context.go('/login?role=driver'),
                  child: const Text('Already have an account? Log in'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  const _RoleCard({required this.icon, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: AppTheme.primary, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: AppTheme.muted)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppTheme.muted),
          ],
        ),
      ),
    );
  }
}
