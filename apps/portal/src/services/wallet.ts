import { api } from "@/lib/api";
import type {
  CoinSummary,
  CoinTransaction,
  WalletSummary,
  WalletTransaction,
} from "@/types";

// Layer 3 — Service / API. Thin HTTP calls for the two ledgers; the mock backend
// (src/msw) derives balances and owns the append-only stores.

export async function getWalletSummary(): Promise<WalletSummary> {
  return (await api.get<WalletSummary>("/me/wallet")).data;
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  return (await api.get<WalletTransaction[]>("/me/wallet/transactions")).data;
}

export async function requestWithdraw(amount: number): Promise<WalletSummary> {
  return (await api.post<WalletSummary>("/me/wallet/withdraw", { amount })).data;
}

export async function getCoinSummary(): Promise<CoinSummary> {
  return (await api.get<CoinSummary>("/me/coins")).data;
}

export async function getCoinTransactions(): Promise<CoinTransaction[]> {
  return (await api.get<CoinTransaction[]>("/me/coins/transactions")).data;
}
