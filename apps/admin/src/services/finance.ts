import { api } from "@/lib/api";
import type { AdminWithdrawal, FinanceSummary, WithdrawalStatus } from "@/types";

// Layer 3 — Service / API. Thin HTTP calls; the mock backend owns the state.

export async function getWithdrawals(): Promise<AdminWithdrawal[]> {
  return (await api.get<AdminWithdrawal[]>("/admin/withdrawals")).data;
}

export async function setWithdrawalStatus(
  id: string,
  status: WithdrawalStatus
): Promise<AdminWithdrawal> {
  return (
    await api.patch<AdminWithdrawal>(`/admin/withdrawals/${id}`, { status })
  ).data;
}

export async function getFinance(): Promise<FinanceSummary> {
  return (await api.get<FinanceSummary>("/admin/finance")).data;
}
