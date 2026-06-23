"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as friendsService from "@/services/friends.service";
import { queryKeys } from "@/lib/query-keys";

export function useFriends() {
  return useQuery({
    queryKey: queryKeys.friends,
    queryFn: friendsService.listFriends,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: friendsService.addFriend,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.friends }),
        queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
      ]),
  });
}
