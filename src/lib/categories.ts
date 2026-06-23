/** Expense categories with friendly labels + emoji icons. */
export interface Category {
  key: string;
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { key: "general", label: "General", emoji: "🧾" },
  { key: "food", label: "Food & Drink", emoji: "🍽️" },
  { key: "groceries", label: "Groceries", emoji: "🛒" },
  { key: "transport", label: "Transport", emoji: "🚕" },
  { key: "travel", label: "Travel", emoji: "✈️" },
  { key: "rent", label: "Rent", emoji: "🏠" },
  { key: "utilities", label: "Utilities", emoji: "💡" },
  { key: "entertainment", label: "Entertainment", emoji: "🎬" },
  { key: "shopping", label: "Shopping", emoji: "🛍️" },
  { key: "health", label: "Health", emoji: "💊" },
  { key: "other", label: "Other", emoji: "🔖" },
];

const byKey = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryEmoji(key: string | null | undefined): string {
  if (!key) return "🧾";
  return byKey.get(key)?.emoji ?? "🔖";
}

export function categoryLabel(key: string | null | undefined): string {
  if (!key) return "General";
  return byKey.get(key)?.label ?? key;
}
