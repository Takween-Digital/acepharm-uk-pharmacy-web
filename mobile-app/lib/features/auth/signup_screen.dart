import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/theme/ace_colors.dart';
import '../../core/theme/ace_spacing.dart';
import '../../core/widgets/ace_background.dart';
import '../../core/widgets/widgets.dart';
import 'auth_error.dart';
import 'auth_repository.dart';
import 'widgets/password_strength_meter.dart';

Future<bool> _defaultUrlOpener(Uri url) =>
    launchUrl(url, mode: LaunchMode.externalApplication);

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({
    super.key,
    this.authRepository,
    this.analyticsService,
    this.urlOpener = _defaultUrlOpener,
  });

  final AuthRepository? authRepository;
  final AnalyticsService? analyticsService;

  /// Injectable for tests — defaults to the real `launchUrl`.
  final Future<bool> Function(Uri url) urlOpener;

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  late final AuthRepository _authRepository =
      widget.authRepository ?? AuthRepository();
  late final AnalyticsService _analyticsService =
      widget.analyticsService ?? AnalyticsService();
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorText;
  String _password = '';
  bool _agreedTerms = false;
  bool _marketingOptIn = false;

  late final _termsTap = TapGestureRecognizer()
    ..onTap = () => widget.urlOpener(Uri.parse('https://acepharmexams.co.uk/terms'));
  late final _privacyTap = TapGestureRecognizer()
    ..onTap = () => widget.urlOpener(Uri.parse('https://acepharmexams.co.uk/privacy'));

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    _termsTap.dispose();
    _privacyTap.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreedTerms) {
      setState(() {
        _errorText =
            'Please agree to the AcePharm Terms and Privacy Policy to continue.';
      });
      return;
    }
    setState(() {
      _isSubmitting = true;
      _errorText = null;
    });
    try {
      final firstName = _nameController.text.trim();
      await _authRepository.signUpWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        firstName: firstName.isEmpty ? null : firstName,
        marketingOptIn: _marketingOptIn,
      );
      unawaited(_analyticsService.logSignUp());
    } catch (error) {
      if (!mounted) return;
      setState(() => _errorText = describeAuthError(error));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: AceBackground(
        assetPath: 'assets/backgrounds/auth-hero.svg',
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AceSpacing.xl),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Create your account',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: AceSpacing.xs),
                  const Text(
                    'Start with a free diagnostic session.',
                    style: TextStyle(color: AceColors.slate),
                  ),
                  const SizedBox(height: AceSpacing.xxl),
                  AceInput(
                    label: 'First name',
                    controller: _nameController,
                    textInputAction: TextInputAction.next,
                    prefixIcon: Icons.person_outline,
                  ),
                  const SizedBox(height: AceSpacing.md),
                  AceInput(
                    label: 'Email',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    prefixIcon: Icons.mail_outline,
                    validator: (value) => (value == null || !value.contains('@'))
                        ? 'Enter a valid email address'
                        : null,
                  ),
                  const SizedBox(height: AceSpacing.md),
                  AceInput(
                    label: 'Password',
                    controller: _passwordController,
                    obscureText: true,
                    textInputAction: TextInputAction.next,
                    onChanged: (value) => setState(() => _password = value),
                    validator: (value) {
                      if (value == null || value.length < 8) {
                        return 'Use at least 8 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: AceSpacing.sm),
                  PasswordStrengthMeter(password: _password),
                  const SizedBox(height: AceSpacing.md),
                  AceInput(
                    label: 'Confirm password',
                    controller: _confirmController,
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    validator: (value) => value != _passwordController.text
                        ? 'Passwords do not match'
                        : null,
                  ),
                  const SizedBox(height: AceSpacing.md),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        key: const Key('terms-consent-checkbox'),
                        value: _agreedTerms,
                        onChanged: (value) =>
                            setState(() => _agreedTerms = value ?? false),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: AceSpacing.sm),
                          child: RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                color: AceColors.ink,
                                fontSize: 13,
                              ),
                              children: [
                                const TextSpan(text: 'I agree to the AcePharm '),
                                TextSpan(
                                  text: 'Terms',
                                  recognizer: _termsTap,
                                  style: const TextStyle(
                                    color: AceColors.aceIndigo,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const TextSpan(text: ' and '),
                                TextSpan(
                                  text: 'Privacy Policy',
                                  recognizer: _privacyTap,
                                  style: const TextStyle(
                                    color: AceColors.aceIndigo,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const TextSpan(text: '.'),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        key: const Key('marketing-consent-checkbox'),
                        value: _marketingOptIn,
                        onChanged: (value) =>
                            setState(() => _marketingOptIn = value ?? false),
                      ),
                      const Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(top: AceSpacing.sm),
                          child: Text(
                            'Send me useful revision guidance and AcePharm '
                            'product updates.',
                            style: TextStyle(color: AceColors.slate, fontSize: 13),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_errorText != null) ...[
                    const SizedBox(height: AceSpacing.xs),
                    Text(
                      _errorText!,
                      style: const TextStyle(
                        color: AceColors.dangerRose,
                        fontSize: 13,
                      ),
                    ),
                  ],
                  const SizedBox(height: AceSpacing.lg),
                  AceButton(
                    label: 'Create account',
                    isLoading: _isSubmitting,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
