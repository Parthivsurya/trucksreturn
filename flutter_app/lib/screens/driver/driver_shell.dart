import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';
import 'driver_home_tab.dart';
import 'driver_matches_tab.dart';
import 'driver_bookings_tab.dart';
import 'driver_profile_tab.dart';

class DriverShell extends StatefulWidget {
  const DriverShell({super.key});

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int _idx = 0;
  void _setIndex(int i) => setState(() => _idx = i);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.user == null) return const SizedBox.shrink();

    final tabs = [
      DriverHomeTab(onViewMatches: () => _setIndex(1)),
      const DriverMatchesTab(),
      const DriverBookingsTab(),
      const DriverProfileTab(),
    ];

    return Scaffold(
      body: IndexedStack(index: _idx, children: tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _idx,
        onDestinationSelected: (i) => setState(() => _idx = i),
        backgroundColor: AppTheme.surface,
        indicatorColor: AppTheme.accentWeak,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined, color: AppTheme.muted),
            selectedIcon: Icon(Icons.home_rounded, color: AppTheme.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.search_outlined, color: AppTheme.muted),
            selectedIcon: Icon(Icons.search_rounded, color: AppTheme.primary),
            label: 'Loads',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined, color: AppTheme.muted),
            selectedIcon: Icon(Icons.assignment_rounded, color: AppTheme.primary),
            label: 'Trips',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded, color: AppTheme.muted),
            selectedIcon: Icon(Icons.person_rounded, color: AppTheme.primary),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
