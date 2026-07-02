import type { CoinTransaction, WalletTransaction } from "@/types";

// Lens Xu (reward points) rules — UI phase. 1 xu = 1 VND (quy ước). All tunable
// here; the mock backend (src/msw) enforces them. NOTE (giả định tạm): final
// values + anti-abuse land with the backend.

/** Cashback rate on the CASH portion of a completed shoot (5–10%). */
export const CASHBACK_RATE = 0.08;

/** Max share of an order that can be paid with Lens Xu (đề xuất 30–50%). */
export const COIN_REDEEM_CAP_RATE = 0.3;

/** Earned coins expire after this many months. */
export const COIN_EXPIRY_MONTHS = 12;

/** Coins expiring within this many days are flagged "sắp hết hạn". */
export const COIN_EXPIRING_SOON_DAYS = 30;

/** Display name for reward points across the whole UI. */
export const COIN_LABEL = "Lens Xu";

/** Cashback earned on a shoot, based on the CASH actually paid (not coins).
 *  Rounded to a clean 1k so the figure reads nicely. */
export function cashbackCoins(cashPaid: number): number {
  return Math.round((cashPaid * CASHBACK_RATE) / 1_000) * 1_000;
}

/** Ceiling of coins usable on one order: min(balance, cap% of price), 1k-clean. */
export function maxRedeemableCoins(price: number, coinBalance: number): number {
  const cap = Math.floor((price * COIN_REDEEM_CAP_RATE) / 1_000) * 1_000;
  return Math.max(0, Math.min(coinBalance, cap));
}

/** Format a coin amount, e.g. `150.000 Lens Xu`. */
export function formatCoins(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ${COIN_LABEL}`;
}

/** VN label + tinted pill per coin transaction type. */
export const COIN_TX_META: Record<
  CoinTransaction["type"],
  { label: string; className: string }
> = {
  earn: {
    label: "Hoàn xu",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  redeem: {
    label: "Dùng xu",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  expire: {
    label: "Hết hạn",
    className: "bg-muted text-muted-foreground",
  },
  adjust: {
    label: "Điều chỉnh",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

/** VN label + tinted pill per wallet transaction type. */
export const WALLET_TX_META: Record<
  WalletTransaction["type"],
  { label: string; className: string }
> = {
  payout: {
    label: "Giải ngân",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  refund: {
    label: "Hoàn tiền",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  withdraw: {
    label: "Rút tiền",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  },
  topup: {
    label: "Nạp tiền",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
};
