import { getSupabaseClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/repositories/auth.repository";
import type { Profile } from "@/types/database";

export type ProfileSummary = Pick<Profile, "id" | "display_name" | "email">;

export async function selectMyProfile(): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMyProfile(patch: {
  display_name?: string;
  default_currency?: string;
}): Promise<Profile> {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Profiles for the given user ids (RLS restricts these to group peers). */
export async function selectProfilesByIds(
  ids: string[],
): Promise<ProfileSummary[]> {
  if (ids.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return data ?? [];
}
