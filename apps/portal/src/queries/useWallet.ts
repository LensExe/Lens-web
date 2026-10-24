import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWalletPayoutDestination,
  getWalletSummary,
  getWalletTransactions,
  requestWithdraw,
  saveWalletPayoutDestination,
} from "@/services/wallet";
import type {
  PayoutDestinationDto,
  WalletWithdrawalDto,
} from "@/types/payments";

export const walletKeys = {
  summary: ["wallet", "summary"] as const,
  transactions: ["wallet", "transactions"] as const,
  payoutDestination: ["wallet", "payout-destination"] as const,
};

export function useWalletSummary() {
  return useQuery({ queryKey: walletKeys.summary, queryFn: getWalletSummary });
}

export function useWalletTransactions() {
  return useQuery({ queryKey: walletKeys.transactions, queryFn: getWalletTransactions });
}

export function useWalletPayoutDestination(enabled = true) {
  return useQuery({
    queryKey: walletKeys.payoutDestination,
    queryFn: getWalletPayoutDestination,
    enabled,
  });
}

export function useSaveWalletPayoutDestination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayoutDestinationDto) => saveWalletPayoutDestination(input),
    onSuccess: (destination) => {
      qc.setQueryData(walletKeys.payoutDestination, destination);
    },
  });
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
