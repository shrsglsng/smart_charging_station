class ValidationUtil {
  /// Checks if the phone number is exactly 10 digits
  static bool isValidPhone(String phone) {
    final cleanPhone = phone.trim();
    return cleanPhone.length == 10 && RegExp(r'^[0-9]+$').hasMatch(cleanPhone);
  }

  /// Checks if PIN is 4 digits and not insecure (repetitive/sequential)
  static ValidationResult isPinSecure(String pin) {
    final cleanPin = pin.trim();
    if (cleanPin.length != 4 || !RegExp(r'^[0-9]+$').hasMatch(cleanPin)) {
      return ValidationResult(false, 'Pin must be 4 digits');
    }

    // Check for repetitive digits (e.g., 1111)
    if (cleanPin[0] == cleanPin[1] &&
        cleanPin[1] == cleanPin[2] &&
        cleanPin[2] == cleanPin[3]) {
      return ValidationResult(false, 'Repetitive PIN ($cleanPin) is not allowed');
    }

    // Check for sequential digits (e.g., 1234, 4321, 0123, 3210)
    int d1 = int.parse(cleanPin[0]);
    int d2 = int.parse(cleanPin[1]);
    int d3 = int.parse(cleanPin[2]);
    int d4 = int.parse(cleanPin[3]);

    // Increasing sequence
    if ((d2 == d1 + 1 && d3 == d2 + 1 && d4 == d3 + 1)) {
      return ValidationResult(false, 'Sequential PIN ($cleanPin) is not allowed');
    }

    // Decreasing sequence
    if ((d2 == d1 - 1 && d3 == d2 - 1 && d4 == d3 - 1)) {
      return ValidationResult(false, 'Sequential PIN ($cleanPin) is not allowed');
    }

    return ValidationResult(true, '');
  }
}

class ValidationResult {
  final bool isValid;
  final String message;

  ValidationResult(this.isValid, this.message);
}
