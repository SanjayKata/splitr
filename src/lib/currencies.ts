/** A small set of common currencies for group/expense selection. */
export interface Currency {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "CAD", label: "Canadian Dollar", symbol: "$" },
  { code: "AUD", label: "Australian Dollar", symbol: "$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "SGD", label: "Singapore Dollar", symbol: "$" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
];

export const DEFAULT_CURRENCY = "USD";

const byCode = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currencyLabel(code: string): string {
  const c = byCode.get(code);
  return c ? `${c.code} — ${c.label}` : code;
}
