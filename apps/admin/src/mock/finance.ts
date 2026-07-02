import { avatar } from "@lens/ui";
import type { AdminWithdrawal, FinanceSummary } from "@/types";

// Mock finance data (payout withdrawals + platform reserves). Imported ONLY by
// src/msw/handlers.ts. Amounts in VND, Lens Xu in xu (1 xu = 1 VND).
const av = (seed: string) => avatar(seed);
const hoursAgo = (n: number) =>
  new Date(Date.now() - n * 3_600_000).toISOString();

export const mockWithdrawals: AdminWithdrawal[] = [
  { id: "w1", photographerId: "u1", photographerName: "Lý Gia Hân", avatar: av("giahan-av"), amount: 3_200_000, requestedAt: hoursAgo(5), status: "pending" },
  { id: "w2", photographerId: "u3", photographerName: "Trần Quốc Bảo", avatar: av("quocbao-av"), amount: 7_500_000, requestedAt: hoursAgo(20), status: "pending" },
  { id: "w3", photographerId: "u2", photographerName: "Nguyễn Minh Anh", avatar: av("minhanh-av"), amount: 1_800_000, requestedAt: hoursAgo(28), status: "pending" },
  { id: "w4", photographerId: "u1", photographerName: "Lý Gia Hân", avatar: av("giahan-av"), amount: 2_000_000, requestedAt: hoursAgo(72), status: "approved" },
  { id: "w5", photographerId: "u8", photographerName: "Vũ Hoàng Lan", avatar: av("hoanglan-av"), amount: 950_000, requestedAt: hoursAgo(96), status: "approved" },
  { id: "w6", photographerId: "u3", photographerName: "Trần Quốc Bảo", avatar: av("quocbao-av"), amount: 12_000_000, requestedAt: hoursAgo(120), status: "rejected" },
];

// Platform-wide reserves (would be derived from the ledgers in Phase 2).
export const mockFinance: FinanceSummary = {
  walletReserve: 86_400_000,
  coinsOutstanding: 2_450_000,
  pendingWithdrawalTotal: 0, // computed in the handler from pending rows
  pendingCount: 0,
};
