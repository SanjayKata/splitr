/** Centralized React-Query cache keys, so invalidation stays consistent. */
export const queryKeys = {
  profile: ["profile"] as const,
  friends: ["friends"] as const,
  overview: ["overview"] as const,
  notifications: ["notifications"] as const,
  history: ["history"] as const,
  groups: ["groups"] as const,
  group: (id: string | null) => ["group", id] as const,
  members: (id: string | null) => ["members", id] as const,
  expenses: (groupId: string | null) => ["expenses", groupId] as const,
  balances: (groupId: string | null) => ["balances", groupId] as const,
};
