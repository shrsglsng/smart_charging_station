/**
 * Validates a PIN according to the specified rules:
 * - Must be exactly 4 numeric digits
 * - Cannot have all identical digits (e.g., 0000, 1111)
 * - Cannot be sequential digits (e.g., 1234, 2345, 9876, 8765)
 * 
 * @param {string} pin - The PIN to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePin(pin) {
  // Check if PIN is exactly 4 digits
  if (!/^\d{4}$/.test(pin)) {
    return false;
  }

  // Check for identical digits (e.g., 0000, 1111)
  if (/^(\d)\1{3}$/.test(pin)) {
    return false;
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
    return false;
  }

  return true;
}

module.exports = { validatePin };