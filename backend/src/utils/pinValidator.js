/**
 * Validates a PIN according to the specified rules:
 * - Must be exactly 4 numeric digits
 * - Cannot have all identical digits (e.g., 0000, 1111)
 * - Cannot be sequential digits (e.g., 1234, 2345, 9876, 8765)
 * 
 * @param {string} pin - The PIN to validate
 * @returns {Object} - { isValid: boolean, reason?: string }
 */
function validatePin(pin) {
  // Check if PIN is exactly 4 digits
  if (!/^\d{4}$/.test(pin)) {
    return { isValid: false, reason: 'PIN must be exactly 4 digits' };
  }

  // Check for identical digits (e.g., 0000, 1111)
  if (/^(\d)\1{3}$/.test(pin)) {
    return { isValid: false, reason: `Repetitive PIN (${pin}) is not allowed` };
  }

  // Check for sequential digits (forward and backward)
  const digits = pin.split('').map(Number);
  
  // Forward sequential (e.g., 1234, 2345)
  const isForwardSequential = digits.every((digit, index) => 
    index === 0 || digit === digits[index - 1] + 1
  );
  
  // Backward sequential (e.g., 9876, 8765)
  const isBackwardSequential = digits.every((digit, index) => 
    index === 0 || digit === digits[index - 1] - 1
  );
  
  if (isForwardSequential || isBackwardSequential) {
    return { isValid: false, reason: `Sequential PIN (${pin}) is not allowed` };
  }

  return { isValid: true };
}

module.exports = { validatePin };