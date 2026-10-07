import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWalletSummary, getWalletTransactions, requestWithdraw } from "@/services/wallet";
import type { WalletWithdrawalDto } from "@/types/payments";

export const walletKeys = {
  summary: ["wallet", "summary"] as const,
  transactions: ["wallet", "transactions"] as const,
};

export function useWalletSummary() {
  return useQuery({ queryKey: walletKeys.summary, queryFn: getWalletSummary });
}

export function useWalletTransactions() {
  return useQuery({ queryKey: walletKeys.transactions, queryFn: getWalletTransactions });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: WalletWithdrawalDto) => requestWithdraw(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.summary });
      qc.invalidateQueries({ queryKey: walletKeys.transactions });
    },
  });
}
