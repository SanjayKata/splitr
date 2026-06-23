import { getCurrentUserId } from "@/repositories/auth.repository";
import * as groupsRepo from "@/repositories/groups.repository";
import {
  selectProfilesByIds,
  type ProfileSummary,
} from "@/repositories/profiles.repository";
import type { Group, GroupMember } from "@/types/database";

/** Domain object: a group plus its member count, for list views. */
export interface GroupWithCount extends Group {
  memberCount: number;
}

/** Domain object: a membership row joined with the member's profile. */
export interface MemberWithProfile extends GroupMember {
  profile: ProfileSummary | null;
}

/**
 * Real groups the current user belongs to, newest first, with member counts.
 * Direct (friend) groups are hidden — they surface under Friends instead.
 */
export async function listMyGroups(): Promise<GroupWithCount[]> {
  const groups = (await groupsRepo.selectMyGroups()).filter(
    (g) => !g.is_direct,
  );
  if (groups.length === 0) return [];

  const memberships = await groupsRepo.selectMembershipsForGroups(
    groups.map((g) => g.id),
  );

  const counts = new Map<string, number>();
  for (const m of memberships) {
    counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
  }

  return groups.map((g) => ({ ...g, memberCount: counts.get(g.id) ?? 0 }));
}

export async function createGroup(input: {
  name: string;
  currency: string;
}): Promise<Group> {
  const created_by = await getCurrentUserId();
  return groupsRepo.insertGroup({
    name: input.name.trim(),
    currency: input.currency,
    created_by,
  });
}

export function getGroup(id: string): Promise<Group | null> {
  return groupsRepo.selectGroupById(id);
}

/** Members of a group, each joined with their profile (name/email). */
export async function listMembers(
  groupId: string,
): Promise<MemberWithProfile[]> {
  const members = await groupsRepo.selectMembersByGroup(groupId);
  if (members.length === 0) return [];

  const profiles = await selectProfilesByIds(members.map((m) => m.user_id));
  const byId = new Map(profiles.map((p) => [p.id, p]));

  return members.map((m) => ({ ...m, profile: byId.get(m.user_id) ?? null }));
}

export function addMemberByEmail(
  groupId: string,
  email: string,
): Promise<void> {
  return groupsRepo.callAddGroupMember(groupId, email.trim());
}

export function removeMember(groupId: string, userId: string): Promise<void> {
  return groupsRepo.callRemoveGroupMember(groupId, userId);
}
