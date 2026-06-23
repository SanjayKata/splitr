import { getCurrentUserId } from "@/repositories/auth.repository";
import * as groupsRepo from "@/repositories/groups.repository";
import * as friendsRepo from "@/repositories/friends.repository";
import {
  selectProfilesByIds,
  type ProfileSummary,
} from "@/repositories/profiles.repository";

export interface Friend {
  userId: string;
  profile: ProfileSummary | null;
}

/**
 * Everyone the current user shares any group with (regular or direct), i.e.
 * their friends — including those with no outstanding balance yet.
 */
export async function listFriends(): Promise<Friend[]> {
  const me = await getCurrentUserId();
  const groups = await groupsRepo.selectMyGroups();
  if (groups.length === 0) return [];

  const memberIds = await groupsRepo.selectMemberUserIdsForGroups(
    groups.map((g) => g.id),
  );
  const friendIds = memberIds.filter((id) => id !== me);
  if (friendIds.length === 0) return [];

  const profiles = await selectProfilesByIds(friendIds);
  const byId = new Map(profiles.map((p) => [p.id, p]));

  return friendIds
    .map((userId) => ({ userId, profile: byId.get(userId) ?? null }))
    .sort((a, b) =>
      (a.profile?.display_name ?? a.profile?.email ?? "").localeCompare(
        b.profile?.display_name ?? b.profile?.email ?? "",
      ),
    );
}

export function addFriend(email: string): Promise<string> {
  return friendsRepo.callAddFriend(email);
}

export function ensureDirectGroup(friendId: string): Promise<string> {
  return friendsRepo.callEnsureDirectGroup(friendId);
}
