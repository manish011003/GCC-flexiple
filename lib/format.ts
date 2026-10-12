/**
 * Formatting utilities for GCC benchmarks, financial figures, and metrics.
 */

export type CurrencyCode = 'INR' | 'USD';

/**
 * Formats a monetary amount into standard Indian currency representation (Lakhs, Crores, or standard currency)
 * or USD representation.
 *
 * @param amount Number to format
 * @param currency 'INR' | 'USD' (default: 'INR')
 * @param unit Optional override: 'raw' | 'lakhs' | 'crores' | 'auto'
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  unit: 'raw' | 'lakhs' | 'crores' | 'auto' = 'auto'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'N/A';
  }

  if (currency === 'USD') {
    if (unit === 'auto') {
      if (Math.abs(amount) >= 1_000_000_000) {
        return `$${(amount / 1_000_000_000).toFixed(1)}B`;
      }
      if (Math.abs(amount) >= 1_000_000) {
        return `$${(amount / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(amount) >= 1_000) {
        return `$${(amount / 1_000).toFixed(1)}K`;
      }
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Currency is INR
  if (unit === 'crores' || (unit === 'auto' && Math.abs(amount) >= 100)) {
    // If amount is given in Lakhs and >= 100 Lakhs (= 1 Crore)
    const crValue = amount / 100;
    return `₹${crValue.toFixed(2)} Cr`;
  }

  if (unit === 'lakhs') {
    return `₹${amount.toFixed(2)} Lakhs`;
  }

  // Raw or standard Indian currency formatting
  if (unit === 'raw') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Default auto for Lakhs representation (since most GCC budgets are expressed in Lakhs)
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`;
}

/**
 * Formats a decimal or percentage value into a clean percent string.
 * e.g., 18.5 -> "18.5%", 0.18 (if isRatio true) -> "18.0%"
 *
 * @param value The numerical percentage
 * @param decimals Number of decimal digits to preserve (default: 1)
 * @param isRatio If true, treats 0.15 as 15% (default: false)
 */
export function formatPercent(value: number, decimals = 1, isRatio = false): string {
  if (isNaN(value) || value === null || value === undefined) {
    return 'N/A';
  }
  const pct = isRatio ? value * 100 : value;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Formats a numerical low-to-high range with an optional formatting function.
 * e.g. formatRange(8, 15, (v) => `₹${v} LPA`) => "₹8 LPA – ₹15 LPA" or "₹8 – ₹15 LPA"
 *
 * @param low Lower bound
 * @param high Upper bound
 * @param formatter Optional function to format each individual value
 */
export function formatRange(
  low: number,
  high: number,
  formatter?: (val: number) => string
): string {
  if (low === high) {
    return formatter ? formatter(low) : `${low}`;
  }
  const formattedLow = formatter ? formatter(low) : `${low}`;
  const formattedHigh = formatter ? formatter(high) : `${high}`;
  return `${formattedLow} - ${formattedHigh}`;
}
