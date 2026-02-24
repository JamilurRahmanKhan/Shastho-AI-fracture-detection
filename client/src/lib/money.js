/**
 * Frontend: money
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: Client-side module used by the ShasthoAI web app.
 *
 * Project-specific notes:
 * - (none)
 */

export const money = {
  /**
   * Format amount with either a currency symbol (preferred) or currency code.
   * Backwards-compatible:
   * - money.fmt(10) -> "৳10.00"
   * - money.fmt(10, "USD") -> "$10.00"
   * - money.fmt(10, "BDT") -> "৳10.00"
   * - money.fmt(10, "BDT", "৳") -> "৳10.00"
   */
  // Default to Bangladesh Taka (BDT) across the project.
  fmt(amount, currency = 'BDT', currencySymbol = '') {
    const n = Number(amount || 0);
    const fixed = n.toFixed(2);

    const code = String(currency || '').toUpperCase();

    const sym =
      currencySymbol ||
      (code === 'USD'
        ? '$'
        : code === 'BDT'
          ? '৳'
          : code === 'EUR'
            ? '€'
            : code === 'GBP'
              ? '£'
              : '');

    if (sym) return `${sym}${fixed}`;
    if (!code) return fixed;
    return `${fixed} ${code}`;
  },
};
