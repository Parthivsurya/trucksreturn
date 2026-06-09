import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';

class LoginScreen extends StatefulWidget {
  final String role;
  const LoginScreen({super.key, required this.role});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  bool _isPasswordMode = false;
  bool _loading = false;
  bool _hidePassword = true;
  bool _emailValid = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _checkEmailValidity(String val) {
    final ok = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(val.trim());
    if (ok != _emailValid) {
      setState(() => _emailValid = ok);
    }
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    final email = _emailController.text.trim();
    
    setState(() => _loading = true);
    
    if (_isPasswordMode) {
      // Existing User login with password
      final password = _passwordController.text;
      final err = await context.read<AuthProvider>().login(email, password);
      if (!mounted) return;
      setState(() => _loading = false);
      if (err != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppTheme.danger),
        );
      }
    } else {
      // New User OTP request
      final err = await context.read<AuthProvider>().sendOtp(email);
      if (!mounted) return;
      setState(() => _loading = false);
      
      if (err == null) {
        // Success -> Route to OTP screen
        context.go('/register?role=${widget.role}&email=$email');
      } else if (err.contains('already registered')) {
        // Email exists -> Switch to Password Login mode
        setState(() {
          _isPasswordMode = true;
        });
      } else {
        // Other error
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppTheme.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDriver = widget.role == 'driver';
    
    return Scaffold(
      backgroundColor: AppTheme.bg,
      appBar: AppBar(
        backgroundColor: AppTheme.bg,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppTheme.text),
          onPressed: () {
            if (_isPasswordMode) {
              setState(() {
                _isPasswordMode = false;
                _passwordController.clear();
              });
            } else {
              context.go('/role');
            }
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 26.0),
                child: Form(
                  key: _form,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      // Dynamic Role Context Chip
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 7.0),
                        decoration: BoxDecoration(
                          color: AppTheme.accentWeak,
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isDriver ? Icons.local_shipping_rounded : Icons.inventory_2_rounded,
                              color: AppTheme.primaryDark,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              isDriver ? 'Signing in as a truck driver' : 'Signing in as a shipper',
                              style: const TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primaryDark,
                                fontFamily: 'Roboto',
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),
                      // Welcome / Prompt Header
                      Text(
                        _isPasswordMode ? 'Welcome back' : 'What\'s your email?',
                        style: const TextStyle(
                          fontSize: 23,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.text,
                          fontFamily: 'Roboto',
                          height: 1.15,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _isPasswordMode
                            ? 'Log in to your account with password.'
                            : 'We\'ll send a one-time code to verify it.',
                        style: const TextStyle(
                          fontSize: 13.5,
                          color: AppTheme.muted,
                          fontFamily: 'Roboto',
                        ),
                      ),
                      const SizedBox(height: 22),
                      // Email Field
                      TextFormField(
                        controller: _emailController,
                        enabled: !_isPasswordMode,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.text,
                          fontFamily: 'Roboto',
                        ),
                        decoration: InputDecoration(
                          hintText: 'you@example.com',
                          prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.muted),
                          labelText: _isPasswordMode ? 'Email' : null,
                        ),
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        onChanged: _checkEmailValidity,
                        validator: (v) {
                          final s = v?.trim() ?? '';
                          if (s.isEmpty) return 'Email is required';
                          if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(s)) {
                            return 'Enter a valid email';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      // Password Field (Visible only in Password Mode)
                      if (_isPasswordMode) ...[
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _hidePassword,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.text,
                            fontFamily: 'Roboto',
                          ),
                          decoration: InputDecoration(
                            labelText: 'Password',
                            prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.muted),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _hidePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                color: AppTheme.muted,
                              ),
                              onPressed: () => setState(() => _hidePassword = !_hidePassword),
                            ),
                          ),
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(),
                          validator: (v) => (v == null || v.isEmpty) ? 'Password is required' : null,
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () {},
                            child: const Text('Forgot password?'),
                          ),
                        ),
                      ] else ...[
                        // Hint text for Code verification
                        const Text(
                          'We\'ll email you a 6-digit code to sign in.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.muted,
                            fontFamily: 'Roboto',
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            // Footer Action Button
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 14, 22, 26),
              child: FilledButton(
                onPressed: (_emailValid && !_loading) ? _submit : null,
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(_isPasswordMode ? 'Log in' : 'Send code'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
