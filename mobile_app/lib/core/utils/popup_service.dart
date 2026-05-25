import 'package:flutter/material.dart';

/// Universal popup dialog service.
/// Replaces all toasts, snackbars, and overlay notifications with
/// centered dismissible popup dialogs.
class PopupService {
  /// Shows an error popup dialog with an OK button.
  /// Dismissible via OK button, back gesture, or tapping outside.
  static void showError(BuildContext context, String message) {
    show(context, message, isError: true);
  }

  /// Shows an info popup dialog with an OK button.
  /// Dismissible via OK button, back gesture, or tapping outside.
  static void showInfo(BuildContext context, String message) {
    show(context, message, isError: false);
  }

  /// Core popup dialog method.
  /// [isError] controls icon and accent color styling.
  static void show(BuildContext context, String message, {bool isError = true}) {
    showDialog(
      context: context,
      barrierDismissible: true, // Tap outside to dismiss
      builder: (dialogContext) {
        final size = MediaQuery.of(dialogContext).size;
        return PopScope(
          canPop: true, // Back gesture dismisses
          child: Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: size.width * 0.5),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: (isError ? Colors.red : Colors.blue).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isError ? Icons.error_outline_rounded : Icons.info_outline_rounded,
                        color: isError ? Colors.red : Colors.blue,
                        size: 48,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      isError ? 'Error' : 'Info',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () => Navigator.of(dialogContext).pop(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isError ? Colors.red : Colors.blue,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'OK',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
