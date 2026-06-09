import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_provider.dart';
import '../../core/theme.dart';

class RegisterScreen extends StatefulWidget {
  final String role;
  const RegisterScreen({super.key, required this.role});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  // 6 OTP Digit Controllers & FocusNodes
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  String _email = '';
  bool _otpVerified = false;
  bool _loading = false;
  bool _hidePassword = true;
  int _resendCountdown = 30;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Retrieve email query parameter
    final uri = GoRouterState.of(context).uri;
    _email = uri.queryParameters['email'] ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _resendCountdown = 30;
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCountdown > 0) {
        setState(() => _resendCountdown--);
      } else {
        _countdownTimer?.cancel();
      }
    });
  }

  Future<void> _resendOtp() async {
    if (_email.isEmpty) return;
    setState(() => _loading = true);
    final err = await context.read<AuthProvider>().sendOtp(_email);
    setState(() => _loading = false);
    if (!mounted) return;
    if (err == null) {
      _startCountdown();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP code resent successfully.'), backgroundColor: AppTheme.success),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: AppTheme.danger),
      );
    }
  }

  String _getOtpCode() {
    return _otpControllers.map((c) => c.text.trim()).join();
  }

  bool _isOtpComplete() {
    return _otpControllers.every((c) => c.text.isNotEmpty);
  }

  void _verifyOtp() {
    if (!_isOtpComplete()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit code.'), backgroundColor: AppTheme.danger),
      );
      return;
    }
    // Set OTP verified state to slide in profile info form
    setState(() {
      _otpVerified = true;
    });
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _loading = true);
    final otp = _getOtpCode();
    final err = await context.read<AuthProvider>().register(
      name: _nameController.text.trim(),
      email: _email,
      phone: _phoneController.text.trim(),
      password: _passwordController.text,
      role: widget.role,
      otp: otp,
    );
    
    if (!mounted) return;
    setState(() => _loading = false);
    
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(err), backgroundColor: AppTheme.danger),
      );
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
            if (_otpVerified) {
              setState(() => _otpVerified = false);
            } else {
              context.go('/login?role=${widget.role}');
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
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 10),
                      // Context Label
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
                              isDriver ? 'Registering as a truck driver' : 'Registering as a shipper',
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
                      // Dynamic Headers
                      Text(
                        _otpVerified ? 'Complete profile' : 'Enter the code',
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
                      RichText(
                        text: TextSpan(
                          style: const TextStyle(
                            fontSize: 13.5,
                            color: AppTheme.muted,
                            fontFamily: 'Roboto',
                          ),
                          children: [
                            TextSpan(text: _otpVerified ? 'Fill details to create account for ' : 'Sent to '),
                            TextSpan(
                              text: _email,
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.text),
                            ),
                            if (!_otpVerified) ...[
                              const TextSpan(text: ' · '),
                              WidgetSpan(
                                alignment: PlaceholderAlignment.middle,
                                child: GestureDetector(
                                  onTap: () => context.go('/login?role=${widget.role}'),
                                  child: const Text(
                                    'Edit',
                                    style: TextStyle(
                                      color: AppTheme.primaryDark,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13.5,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 26),
                      
                      // DYNAMIC VIEW: OTP boxes OR Profile forms
                      if (!_otpVerified) ...[
                        // 6-digit OTP row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: List.generate(6, (index) {
                            return SizedBox(
                              width: 46,
                              height: 56,
                              child: TextFormField(
                                controller: _otpControllers[index],
                                focusNode: _otpFocusNodes[index],
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.text,
                                  fontFamily: 'Roboto',
                                ),
                                keyboardType: TextInputType.number,
                                maxLength: 1,
                                decoration: InputDecoration(
                                  counterText: '',
                                  contentPadding: EdgeInsets.zero,
                                  fillColor: _otpControllers[index].text.isNotEmpty
                                      ? AppTheme.accentWeak
                                      : AppTheme.surface,
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: _otpControllers[index].text.isNotEmpty
                                          ? AppTheme.primary
                                          : AppTheme.border,
                                      width: 1.5,
                                    ),
                                  ),
                                ),
                                onChanged: (val) {
                                  setState(() {}); // refresh border color logic
                                  if (val.isNotEmpty) {
                                    if (index < 5) {
                                      _otpFocusNodes[index + 1].requestFocus();
                                    } else {
                                      _otpFocusNodes[index].unfocus();
                                    }
                                  } else {
                                    // if empty and delete is clicked, go back
                                    if (index > 0) {
                                      _otpFocusNodes[index - 1].requestFocus();
                                    }
                                  }
                                },
                              ),
                            );
                          }),
                        ),
                        const SizedBox(height: 24),
                        // Resend option
                        Center(
                          child: _resendCountdown > 0
                              ? Text(
                                  'Resend code in 0:${_resendCountdown.toString().padLeft(2, '0')}',
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: AppTheme.muted,
                                    fontFamily: 'Roboto',
                                  ),
                                )
                              : GestureDetector(
                                  onTap: _loading ? null : _resendOtp,
                                  child: RichText(
                                    text: const TextSpan(
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        color: AppTheme.muted,
                                        fontFamily: 'Roboto',
                                      ),
                                      children: [
                                        TextSpan(text: 'Didn\'t receive code? '),
                                        TextSpan(
                                          text: 'Resend code',
                                          style: TextStyle(
                                            color: AppTheme.primaryDark,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                        ),
                      ] else ...[
                        // Profile Info Fields
                        TextFormField(
                          controller: _nameController,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.text,
                            fontFamily: 'Roboto',
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Full name',
                            prefixIcon: Icon(Icons.person_outline_rounded, color: AppTheme.muted),
                          ),
                          textInputAction: TextInputAction.next,
                          validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _phoneController,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.text,
                            fontFamily: 'Roboto',
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Phone number (optional)',
                            prefixIcon: Icon(Icons.phone_outlined, color: AppTheme.muted),
                          ),
                          keyboardType: TextInputType.phone,
                          textInputAction: TextInputAction.next,
                        ),
                        const SizedBox(height: 14),
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
                          onFieldSubmitted: (_) => _submitRegistration(),
                          validator: (v) {
                            if (v == null || v.isEmpty) return 'Password is required';
                            if (v.length < 8) return 'Password must be at least 8 characters';
                            return null;
                          },
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
                onPressed: _loading
                    ? null
                    : (_otpVerified
                        ? _submitRegistration
                        : (_isOtpComplete() ? _verifyOtp : null)),
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : Text(_otpVerified ? 'Verify & continue' : 'Verify code'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
