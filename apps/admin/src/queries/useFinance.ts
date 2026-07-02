import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFinance,
  getWithdrawals,
  setWithdrawalStatus,
} from "@/services/finance";
import type { WithdrawalStatus } from "@/types";

// Layer 2 — Query hooks.
export const financeKeys = {
  withdrawals: ["withdrawals"] as const,
  summary: ["finance"] as const,
};

export function useWithdrawals() {
  return useQuery({
    queryKey: financeKeys.withdrawals,
    queryFn: getWithdrawals,
  });
}

export function useFinance() {
  return useQuery({
    queryKey: financeKeys.summary,
    queryFn: getFinance,
  });
}

export function useSetWithdrawalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WithdrawalStatus }) =>
      setWithdrawalStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.withdrawals });
      qc.invalidateQueries({ queryKey: financeKeys.summary });
    },
  });
}
