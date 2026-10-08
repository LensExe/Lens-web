import { paymentApi } from "@/services/backend";
import type { ApiObject } from "@/types/common";
import type { WalletLedgerQueryDto, WalletWithdrawalDto } from "@/types/payments";
import type { WalletSummary, WalletTransaction } from "@/types";

const row = (value: unknown): ApiObject => value && typeof value === "object" ? value as ApiObject : {};
const amount = (value: unknown) => typeof value === "number" ? value : Number(value ?? 0) || 0;
const string = (value: unknown) => typeof value === "string" ? value : "";

export async function getWalletSummary(): Promise<WalletSummary> {
  const wallet = row(await paymentApi.getWallet());
  return { balance: amount(wallet.balance), frozenBalance: amount(wallet.frozen_balance) };
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const limit = 100;
  const first = await paymentApi.getWalletLedger({ limit, offset: 0 });
  const pages = await Promise.all(Array.from(
    { length: Math.ceil(Math.max(0, first.total - first.items.length) / limit) },
    (_, index) => paymentApi.getWalletLedger({ limit, offset: first.items.length + index * limit } satisfies WalletLedgerQueryDto),
  ));
  return [first.items, ...pages.map((page) => page.items)].flat().map((item) => {
    const entry = row(item);
    const entryType = string(entry.entry_type);
    const type: WalletTransaction["type"] = entryType === "topup" ? "topup"
      : entryType.startsWith("withdrawal") ? "withdraw"
      : entryType.startsWith("refund") ? "refund"
      : entryType === "booking_escrow_release" ? "payout"
      : "booking";
    const delta = amount(entry.available_delta) || amount(entry.frozen_delta);
    const status: WalletTransaction["status"] = entry.status === "pending" ? "pending" : "completed";
    return {
      id: string(entry.id) || string(entry.idempotency_key),
      userId: "",
      type,
      amount: delta,
      status,
      createdAt: string(entry.created_at),
      note: string(entry.description) || entryType,
    };
  }).filter((transaction) => transaction.amount !== 0);
}

export async function requestWithdraw(input: WalletWithdrawalDto): Promise<ApiObject> {
  return paymentApi.requestWalletWithdrawal(input);
}
