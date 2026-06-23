import { getSupabaseClient } from "@/lib/supabase/client";
import type { Settlement } from "@/types/database";

/** Data access for settlements (recorded payments between members). */

export async function insertSettlement(input: {
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  note: string | null;
  created_by: string;
}): Promise<Settlement> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("settlements")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function selectSettlementsByGroup(
  groupId: string,
): Promise<Settlement[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function selectSettlementsByGroups(
  groupIds: string[],
): Promise<Settlement[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .in("group_id", groupIds);
  if (error) throw new Error(error.message);
  return data ?? [];
}
