import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Auth data access. The current user's identity comes from the JWT held by the
 * Supabase client (sent as `Authorization: Bearer <token>` on every request).
 */
export async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}
