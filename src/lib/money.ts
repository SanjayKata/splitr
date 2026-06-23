/**
 * Money helpers.
 *
 * Splitting bills is sensitive to floating-point error (e.g. 0.1 + 0.2), so we
 * round explicitly at well-defined points. Amounts are handled as decimal
 * numbers here; rounding to 2 decimals (minor units / "cents") is applied
 * wherever a value is finalized for storage or display.
 */

/** Round a monetary amount to 2 decimal places, avoiding binary FP drift. */
export function roundToCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Format an amount as a localized currency string.
 * @param amount value in major units (e.g. 12.5)
 * @param currency ISO 4217 code (e.g. "INR", "USD")
 * @param locale BCP-47 locale, defaults to the runtime locale
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale?: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(roundToCents(amount));
}
