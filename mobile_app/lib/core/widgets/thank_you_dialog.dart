import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ThankYouDialog extends StatefulWidget {
  final String message;

  const ThankYouDialog({
    super.key,
    required this.message,
  });

  static void show(BuildContext context, {required String message}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => ThankYouDialog(message: message),
    );
  }

  @override
  State<ThankYouDialog> createState() => _ThankYouDialogState();
}

class _ThankYouDialogState extends State<ThankYouDialog> {
  Timer? _redirectTimer;

  @override
  void initState() {
    super.initState();
    // Start the timer inside the state to ensure it always fires
    _redirectTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        context.go('/');
      }
    });
  }

  @override
  void dispose() {
    _redirectTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.6,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 60),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: Colors.green,
                  size: 100,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'THANK YOU!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                  letterSpacing: 2,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                widget.message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
