import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/auth/auth_provider.dart';
import 'core/router.dart';
import 'core/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final auth = AuthProvider();
  auth.bootstrap();
  runApp(ReturnLoadApp(auth: auth));
}

class ReturnLoadApp extends StatefulWidget {
  final AuthProvider auth;
  const ReturnLoadApp({super.key, required this.auth});

  @override
  State<ReturnLoadApp> createState() => _ReturnLoadAppState();
}

class _ReturnLoadAppState extends State<ReturnLoadApp> {
  late final _router = buildRouter(widget.auth);

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: widget.auth,
      child: MaterialApp.router(
        title: 'ReturnLoad',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        routerConfig: _router,
      ),
    );
  }
}
