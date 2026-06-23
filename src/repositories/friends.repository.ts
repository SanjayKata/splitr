import { getSupabaseClient } from "@/lib/supabase/client";

/** Add a friend by email; returns the direct group id between the two users. */
export async function callAddFriend(email: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("add_friend", { _email: email });
  if (error) throw new Error(error.message);
  return data;
}

/** Find or create the direct group with a friend; returns its id. */
export async function callEnsureDirectGroup(friendId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("ensure_direct_group", {
    _friend_id: friendId,
  });
  if (error) throw new Error(error.message);
  return data;
}
