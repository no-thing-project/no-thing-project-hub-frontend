/**
 * Formats a number into a compact string representation (e.g., 1500 -> "1.5K", 1500000 -> "1.5M").
 * @param {number} points - The number to format.
 * @param {Object} [options] - Formatting options.
 * @param {number} [options.decimals=1] - Number of decimal places (0 to disable).
 * @param {boolean} [options.allowNegative=false] - Allow negative numbers.
 * @returns {string} Formatted string or "0" for invalid inputs.
 */
export const formatPoints = (points, options = {}) => {
  const { decimals = 1, allowNegative = false } = options;

  // Validate input
  if (typeof points !== 'number' || Number.isNaN(points)) {
    return '0';
  }

  // Handle negative numbers
  const isNegative = points < 0;
  if (isNegative && !allowNegative) {
    return '0';
  }
  const absPoints = Math.abs(points);

  // Configuration for thresholds and suffixes
  const formats = [
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
    { threshold: 0, suffix: '' },
  ];

  // Find appropriate format
  const { threshold, suffix } = formats.find(({ threshold }) => absPoints >= threshold) || formats[formats.length - 1];

  // Format number
  if (threshold === 0) {
    return (isNegative ? '-' : '') + absPoints.toString();
  }

  const value = absPoints / threshold;
  const formattedValue = decimals === 0
    ? Math.round(value).toString()
    : value.toFixed(decimals).replace(/\.0+$/, '');

  return (isNegative ? '-' : '') + formattedValue + suffix;
};