import * as repo from "@/repositories/notifications.repository";
import { formatMoney } from "@/lib/money";
import type { Notification } from "@/types/database";

/** Human-readable line for a notification. */
export function notificationText(n: Notification): string {
  const amount =
    n.amount != null && n.currency
      ? ` (${formatMoney(n.amount, n.currency)})`
      : "";
  if (n.kind === "settlement") {
    return `${n.actor_name} recorded a payment${amount}`;
  }
  const what = n.title ? `“${n.title}”` : "an expense";
  return `${n.actor_name} added ${what}${amount}`;
}

export function listNotifications(): Promise<Notification[]> {
  return repo.selectMyNotifications();
}

export function markAllRead(): Promise<void> {
  return repo.markAllRead();
}
