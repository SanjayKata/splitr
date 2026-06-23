"use client";

import { useQuery } from "@tanstack/react-query";
import * as overviewService from "@/services/overview.service";
import { queryKeys } from "@/lib/query-keys";

/** Cross-group friend balances + overall owe/owed totals for the current user. */
export function useOverview() {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: overviewService.getOverview,
  });
}
