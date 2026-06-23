import * as settlementsRepo from "@/repositories/settlements.repository";
import * as groupsRepo from "@/repositories/groups.repository";
import { callEnsureDirectGroup } from "@/repositories/friends.repository";
import { getCurrentUserId } from "@/repositories/auth.repository";
import type { ExpenseTarget } from "@/services/expenses.service";
import type { Settlement } from "@/types/database";

/**
 * Record a payment from one member to another, against a group or a friend
 * (non-group settlements use the direct group, mirroring expenses).
 */
export async function recordSettlementForTarget(input: {
  target: ExpenseTarget;
  fromUser: string;
  toUser: string;
  amount: number;
  note?: string | null;
}): Promise<Settlement> {
  if (input.fromUser === input.toUser) {
    throw new Error("Payer and recipient must be different people");
  }

  const groupId =
    input.target.type === "group"
      ? input.target.groupId
      : await callEnsureDirectGroup(input.target.friendId);

  const group = await groupsRepo.selectGroupById(groupId);
  if (!group) throw new Error("Group not found");

  const createdBy = await getCurrentUserId();
  return settlementsRepo.insertSettlement({
    group_id: groupId,
    from_user: input.fromUser,
    to_user: input.toUser,
    amount: input.amount,
    currency: group.currency,
    note: input.note?.trim() ? input.note.trim() : null,
    created_by: createdBy,
  });
}
