"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as groupsService from "@/services/groups.service";
import { queryKeys } from "@/lib/query-keys";

/**
 * React-Query bindings over the groups service. Routes/components use these
 * hooks; they never call services or repositories directly.
 */

export function useGroups() {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: groupsService.listMyGroups,
  });
}

export function useGroup(groupId: string | null) {
  return useQuery({
    queryKey: queryKeys.group(groupId),
    queryFn: () => groupsService.getGroup(groupId!),
    enabled: !!groupId,
  });
}

export function useMembers(groupId: string | null) {
  return useQuery({
    queryKey: queryKeys.members(groupId),
    queryFn: () => groupsService.listMembers(groupId!),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: groupsService.createGroup,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      groupsService.addMemberByEmail(groupId, email),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.members(groupId) }),
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsService.removeMember(groupId, userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.members(groupId) }),
  });
}
