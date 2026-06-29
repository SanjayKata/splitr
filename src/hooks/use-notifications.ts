"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsService from "@/services/notifications.service";
import { getSupabaseClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/types/database";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationsService.listNotifications,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

/**
 * Subscribes to realtime notification inserts for the given user. Calls
 * `onInsert` for each new row and refreshes the notifications query. Returns
 * nothing; cleans up the channel on unmount / user change.
 */
export function useNotificationsRealtime(
  userId: string | undefined,
  onInsert: (n: Notification) => void,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert(payload.new as Notification);
          queryClient.invalidateQueries({
            queryKey: queryKeys.notifications,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, onInsert, queryClient]);
}
