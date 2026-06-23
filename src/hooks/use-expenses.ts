"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as expensesService from "@/services/expenses.service";
import { queryKeys } from "@/lib/query-keys";

/** React-Query bindings over the expenses service. */

export function useExpenses(groupId: string | null) {
  return useQuery({
    queryKey: queryKeys.expenses(groupId),
    queryFn: () => expensesService.listExpenses(groupId!),
    enabled: !!groupId,
  });
}

export function useBalances(groupId: string | null) {
  return useQuery({
    queryKey: queryKeys.balances(groupId),
    queryFn: () => expensesService.getBalances(groupId!),
    enabled: !!groupId,
  });
}

/** Invalidate everything affected by an expense change. */
function useInvalidateExpenseData(groupId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses(groupId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.history }),
    ]);
}

/**
 * Add an expense to a group OR a friend (non-group). Used by the global
 * add-expense flow; invalidates broadly since the target group is dynamic.
 */
export function useAddExpenseForTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: expensesService.addExpenseForTarget,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["balances"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.overview }),
        queryClient.invalidateQueries({ queryKey: queryKeys.history }),
        queryClient.invalidateQueries({ queryKey: queryKeys.friends }),
        queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
      ]),
  });
}

export function useDeleteExpense(groupId: string) {
  const invalidate = useInvalidateExpenseData(groupId);
  return useMutation({
    mutationFn: (expenseId: string) => expensesService.deleteExpense(expenseId),
    onSuccess: invalidate,
  });
}
