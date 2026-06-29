import { getSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/repositories/auth.repository";
import type { Notification } from "@/types/database";

/** Data access for the current user's notifications (RLS limits to own rows). */

export async function selectMyNotifications(
  limit = 50,
): Promise<Notification[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markAllRead(): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw new Error(error.message);
}
