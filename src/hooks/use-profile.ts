"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as profileService from "@/services/profile.service";
import { queryKeys } from "@/lib/query-keys";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: profileService.getMyProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.updateMyProfile,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}
