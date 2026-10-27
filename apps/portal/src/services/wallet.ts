import { paymentApi } from "@/services/backend";
import type { ApiObject } from "@/types/common";
import type {
  PayoutDestinationDto,
  WalletLedgerQueryDto,
  WalletPayoutDestinationDto,
  WalletWithdrawalDto,
} from "@/types/payments";
import type { WalletSummary, WalletTransaction } from "@/types";

const row = (value: unknown): ApiObject =>
  value && typeof value === "object" ? (value as ApiObject) : {};
const amount = (value: unknown) => (typeof value === "number" ? value : Number(value ?? 0) || 0);
const string = (value: unknown) => (typeof value === "string" ? value : "");

export async function getWalletSummary(): Promise<WalletSummary> {
  const wallet = row(await paymentApi.getWallet());
  return { balance: amount(wallet.balance), frozenBalance: amount(wallet.frozen_balance) };
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const limit = 100;
  const first = await paymentApi.getWalletLedger({ limit, offset: 0 });
  const pages = await Promise.all(
    Array.from(
      { length: Math.ceil(Math.max(0, first.total - first.items.length) / limit) },
      (_, index) =>
        paymentApi.getWalletLedger({
          limit,
          offset: first.items.length + index * limit,
        } satisfies WalletLedgerQueryDto),
    ),
  );
  return [first.items, ...pages.map((page) => page.items)]
    .flat()
    .map((item) => {
      const entry = row(item);
      const entryType = string(entry.entry_type);
      const type: WalletTransaction["type"] =
        entryType === "topup"
          ? "topup"
          : entryType.startsWith("withdrawal")
            ? "withdraw"
            : entryType.startsWith("refund")
              ? "refund"
              : entryType === "booking_escrow_release"
                ? "payout"
                : "booking";
      const availableDelta = amount(entry.available_delta);
      const frozenDelta = amount(entry.frozen_delta);
      const delta = availableDelta || frozenDelta;
      const relatedTransaction = row(entry.transaction);
      const bookingData = entry.booking ? row(entry.booking) : undefined;
      const bookingId = string(bookingData?.id);
      const transactionCode = string(relatedTransaction.transaction_code);
      const transactionStatus = string(relatedTransaction.status);
      const paymentGateway = string(relatedTransaction.payment_gateway);
      const status: WalletTransaction["status"] =
        transactionStatus === "pending" ? "pending" : "completed";
      return {
        id: string(entry.id) || string(entry.idempotency_key),
        userId: "",
        type,
        amount: delta,
        entryType,
        availableDelta,
        frozenDelta,
        status,
        ...(bookingId
          ? {
              bookingId,
              booking: {
                id: bookingId,
                status: string(bookingData?.status),
                from: string(bookingData?.from),
                to: string(bookingData?.to),
                packageName:
                  typeof bookingData?.package_name === "string" ? bookingData.package_name : null,
              },
            }
          : {}),
        ...(transactionCode ? { transactionCode } : {}),
        ...(transactionStatus ? { transactionStatus } : {}),
        ...(paymentGateway ? { paymentGateway } : {}),
        createdAt: string(entry.created_at),
        note:
          entryType === "withdrawal_reserve"
            ? "Tiền được chuyển từ số dư khả dụng sang khoản đang giữ"
            : entryType === "withdrawal_paid"
              ? "Khoản đang giữ đã được chi trả về ngân hàng"
              : entryType === "withdrawal_release"
                ? "Tiền được trả từ khoản đang giữ về số dư khả dụng"
                : string(entry.description) || entryType,
      };
    })
    .filter((transaction) => transaction.amount !== 0);
}

export function getWalletPayoutDestination(): Promise<WalletPayoutDestinationDto> {
  return paymentApi.getWalletPayoutDestination();
}

export function saveWalletPayoutDestination(
  input: PayoutDestinationDto,
): Promise<WalletPayoutDestinationDto> {
  return paymentApi.saveWalletPayoutDestination(input);
}

export async function requestWithdraw(input: WalletWithdrawalDto): Promise<ApiObject> {
  return paymentApi.requestWalletWithdrawal(input);
}
