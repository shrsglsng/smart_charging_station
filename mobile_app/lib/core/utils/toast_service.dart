import 'dart:async';
import 'package:flutter/material.dart';

class ToastService {
  static OverlayEntry? _overlayEntry;
  static Timer? _timer;

  static void show(BuildContext context, String message, {bool isError = true}) {
    _timer?.cancel();
    _overlayEntry?.remove();
    _overlayEntry = null;

    final overlay = Overlay.of(context);
    
    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: 50,
        right: 20,
        child: _ToastWidget(
          message: message,
          isError: isError,
          onDismiss: () {
            _overlayEntry?.remove();
            _overlayEntry = null;
            _timer?.cancel();
          },
        ),
      ),
    );

    overlay.insert(_overlayEntry!);

    _timer = Timer(const Duration(seconds: 4), () {
      _overlayEntry?.remove();
      _overlayEntry = null;
    });
  }

  static void showError(BuildContext context, String message) {
    show(context, message, isError: true);
  }

  static void showInfo(BuildContext context, String message) {
    show(context, message, isError: false);
  }
}

class _ToastWidget extends StatefulWidget {
  final String message;
  final bool isError;
  final VoidCallback onDismiss;

  const _ToastWidget({
    required this.message,
    required this.isError,
    required this.onDismiss,
  });

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    _opacityAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    ));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SlideTransition(
      position: _offsetAnimation,
      child: FadeTransition(
        opacity: _opacityAnimation,
        child: Material(
          color: Colors.transparent,
          child: Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.4,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.85),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: widget.isError ? Colors.redAccent.withOpacity(0.5) : Colors.greenAccent.withOpacity(0.5),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  widget.isError ? Icons.error_outline : Icons.check_circle_outline,
                  color: widget.isError ? Colors.redAccent : Colors.greenAccent,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Flexible(
                  child: Text(
                    widget.message,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                InkWell(
                  onTap: () {
                    _controller.reverse().then((_) => widget.onDismiss());
                  },
                  child: const Icon(Icons.close, color: Colors.white54, size: 18),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
