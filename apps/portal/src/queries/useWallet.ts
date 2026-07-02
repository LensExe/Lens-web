import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoinSummary,
  getCoinTransactions,
  getWalletSummary,
  getWalletTransactions,
  requestWithdraw,
} from "@/services/wallet";

// Layer 2 — Query hooks for the wallet (real money) + Lens Xu (coins) ledgers.
export const walletKeys = {
  summary: ["wallet", "summary"] as const,
  transactions: ["wallet", "transactions"] as const,
  coinSummary: ["coins", "summary"] as const,
  coinTransactions: ["coins", "transactions"] as const,
};

export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary,
    queryFn: getWalletSummary,
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: walletKeys.transactions,
    queryFn: getWalletTransactions,
  });
}

export function useCoinSummary() {
  return useQuery({
    queryKey: walletKeys.coinSummary,
    queryFn: getCoinSummary,
  });
}

export function useCoinTransactions() {
  return useQuery({
    queryKey: walletKeys.coinTransactions,
    queryFn: getCoinTransactions,
  });
}

export function useWithdraw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => requestWithdraw(amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: walletKeys.summary });
      qc.invalidateQueries({ queryKey: walletKeys.transactions });
    },
  });
}
