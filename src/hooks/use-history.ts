"use client";

import { useQuery } from "@tanstack/react-query";
import * as historyService from "@/services/history.service";
import { queryKeys } from "@/lib/query-keys";

/** All expense activity across the user's groups, newest first. */
export function useHistory() {
  return useQuery({
    queryKey: queryKeys.history,
    queryFn: historyService.getActivity,
  });
}
