import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';
import '../../widgets/app_button.dart';

class RegisterScreen extends StatefulWidget {
  final String role;
  const RegisterScreen({super.key, required this.role});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _otp = TextEditingController();

  bool _otpSent = false;
  bool _sendingOtp = false;
  bool _registering = false;
  bool _hide = true;
  int _resendIn = 0;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _otp.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final email = _email.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      showError(context, 'Enter a valid email first');
      return;
    }
    setState(() => _sendingOtp = true);
    final err = await context.read<AuthProvider>().sendOtp(email);
    if (!mounted) return;
    setState(() => _sendingOtp = false);
    if (err != null) {
      showError(context, err);
    } else {
      setState(() {
        _otpSent = true;
        _resendIn = 30;
      });
      showSuccess(context, 'OTP sent to $email');
      _tickResend();
    }
  }

  void _tickResend() async {
    while (_resendIn > 0 && mounted) {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return;
      setState(() => _resendIn--);
    }
  }

  Future<void> _register() async {
    if (!_form.currentState!.validate()) return;
    if (!_otpSent) {
      showError(context, 'Please verify your email first');
      return;
    }
    setState(() => _registering = true);
    final err = await context.read<AuthProvider>().register(
          name: _name.text,
          email: _email.text,
          phone: _phone.text,
          password: _password.text,
          role: widget.role,
          otp: _otp.text,
        );
    if (!mounted) return;
    setState(() => _registering = false);
    if (err != null) showError(context, err);
  }

  @override
  Widget build(BuildContext context) {
    final isDriver = widget.role == 'driver';
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/login?role=${widget.role}'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 64, height: 64,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    isDriver ? Icons.local_shipping_rounded : Icons.inventory_2_rounded,
                    color: AppTheme.primary, size: 32,
                  ),
                ),
                const SizedBox(height: 24),
                Text('Create account', style: Theme.of(context).textTheme.displayMedium),
                const SizedBox(height: 6),
                Text(
                  isDriver ? 'Sign up as a driver' : 'Sign up as a shipper',
                  style: const TextStyle(fontSize: 15, color: AppTheme.muted),
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(
                    labelText: 'Full name',
                    prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.muted),
                  ),
                  textInputAction: TextInputAction.next,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _email,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    prefixIcon: const Icon(Icons.mail_outline_rounded, color: AppTheme.muted),
                    suffixIcon: _otpSent
                        ? const Padding(
                            padding: EdgeInsets.only(right: 12),
                            child: Icon(Icons.check_circle_rounded, color: AppTheme.success),
                          )
                        : null,
                  ),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  enabled: !_otpSent,
                  validator: (v) {
                    final s = v?.trim() ?? '';
                    if (s.isEmpty) return 'Email is required';
                    if (!s.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone (optional)',
                    prefixIcon: Icon(Icons.phone_outlined, color: AppTheme.muted),
                  ),
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _password,
                  obscureText: _hide,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, color: AppTheme.muted),
                    suffixIcon: IconButton(
                      icon: Icon(_hide ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppTheme.muted),
                      onPressed: () => setState(() => _hide = !_hide),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 6) return 'Min 6 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                if (!_otpSent)
                  GhostButton(
                    label: _sendingOtp ? 'Sending...' : 'Send verification code',
                    onPressed: _sendingOtp ? null : _sendOtp,
                  )
                else ...[
                  TextFormField(
                    controller: _otp,
                    decoration: const InputDecoration(
                      labelText: 'Enter 6-digit OTP',
                      prefixIcon: Icon(Icons.key_outlined, color: AppTheme.muted),
                    ),
                    keyboardType: TextInputType.number,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _register(),
                    validator: (v) {
                      final s = v?.trim() ?? '';
                      if (s.isEmpty) return 'OTP is required';
                      if (s.length != 6) return '6-digit code';
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _resendIn > 0 || _sendingOtp ? null : _sendOtp,
                      child: Text(_resendIn > 0 ? 'Resend in ${_resendIn}s' : 'Resend code'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  PrimaryButton(
                    label: 'Create account',
                    loading: _registering,
                    onPressed: _register,
                  ),
                ],
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account? ', style: TextStyle(color: AppTheme.muted)),
                    TextButton(
                      onPressed: () => context.go('/login?role=${widget.role}'),
                      child: const Text('Log in'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
