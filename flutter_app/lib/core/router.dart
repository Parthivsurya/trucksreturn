import 'package:go_router/go_router.dart';
import 'auth/auth_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/auth/welcome_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/role_select_screen.dart';
import '../screens/driver/driver_shell.dart';
import '../screens/shipper/shipper_shell.dart';

GoRouter buildRouter(AuthProvider auth) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: auth,
    redirect: (ctx, state) {
      if (auth.loading) return '/splash';
      final loc = state.matchedLocation;
      final loggedIn = auth.isAuthenticated;

      if (loc == '/splash') {
        return loggedIn ? (auth.isDriver ? '/driver' : '/shipper') : '/welcome';
      }

      final atAuth = loc == '/login' || loc == '/register' || loc == '/role' || loc == '/welcome';
      if (!loggedIn && !atAuth) return '/welcome';
      if (loggedIn && atAuth) {
        return auth.isDriver ? '/driver' : '/shipper';
      }
      if (loggedIn && loc.startsWith('/driver') && !auth.isDriver) return '/shipper';
      if (loggedIn && loc.startsWith('/shipper') && !auth.isShipper) return '/driver';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/role', builder: (_, _) => const RoleSelectScreen()),
      GoRoute(path: '/login', builder: (_, s) => LoginScreen(role: s.uri.queryParameters['role'] ?? 'driver')),
      GoRoute(path: '/register', builder: (_, s) => RegisterScreen(role: s.uri.queryParameters['role'] ?? 'driver')),
      GoRoute(path: '/driver', builder: (_, _) => const DriverShell()),
      GoRoute(path: '/shipper', builder: (_, _) => const ShipperShell()),
    ],
  );
}
