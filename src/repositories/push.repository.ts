import { getSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/repositories/auth.repository";

/** Data access for this user's Web Push subscriptions. */

export async function upsertSubscription(sub: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ user_id: userId, ...sub }, { onConflict: "endpoint" });
  if (error) throw new Error(error.message);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}
