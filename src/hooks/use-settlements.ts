"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as settlementsService from "@/services/settlements.service";
import { queryKeys } from "@/lib/query-keys";

/** Record a payment; refreshes balances, overview and history. */
export function useRecordSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settlementsService.recordSettlementForTarget,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
        queryClient.invalidateQueries({ queryKey: queryKeys.friends }),
      ]),
  });
}
