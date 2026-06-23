import { getSupabaseClient } from "@/lib/supabase/client";
import type { Group, GroupMember } from "@/types/database";

/** Data access for groups and group membership. Only this layer touches the DB. */

export async function insertGroup(input: {
  name: string;
  currency: string;
  created_by: string;
}): Promise<Group> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Groups visible to the current user (RLS limits this to their memberships). */
export async function selectMyGroups(): Promise<Group[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function selectGroupById(id: string): Promise<Group | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Membership rows for a set of groups (used to tally member counts). */
export async function selectMembershipsForGroups(
  groupIds: string[],
): Promise<Pick<GroupMember, "group_id">[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Distinct member user-ids across a set of groups. */
export async function selectMemberUserIdsForGroups(
  groupIds: string[],
): Promise<string[]> {
  if (groupIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("user_id")
    .in("group_id", groupIds);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((m) => m.user_id))];
}

export async function selectMembersByGroup(
  groupId: string,
): Promise<GroupMember[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function callAddGroupMember(
  groupId: string,
  email: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("add_group_member", {
    _group_id: groupId,
    _email: email,
  });
  if (error) throw new Error(error.message);
}

export async function callRemoveGroupMember(
  groupId: string,
  userId: string,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc("remove_group_member", {
    _group_id: groupId,
    _user_id: userId,
  });
  if (error) throw new Error(error.message);
}
