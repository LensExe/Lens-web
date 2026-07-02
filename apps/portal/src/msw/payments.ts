import type { CoinSummary, CoinTransaction, WalletTransaction } from "@/types";
import type { PaymentProvider } from "@/lib/payments/provider";
import { COIN_EXPIRING_SOON_DAYS } from "@/lib/wallet";
import { seedCoinLedger, seedWalletLedger } from "@/mock/wallet";

// Concrete UI-phase PaymentProvider: the platform SELF-CUSTODIES funds. Both
// ledgers are append-only and persisted to localStorage (survive reload / role
// switch) like the bookings table. Balances are ALWAYS derived by reducing a
// ledger — never stored. Phase 2 swaps this module for a licensed gateway; the
// PaymentProvider interface (lib/payments/provider.ts) stays identical.

const WALLET_DB_KEY = "lens.wallet.v1";
const COIN_DB_KEY = "lens.coins.v1";

function load<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T[];
  } catch {
    /* storage blocked — fall back to a fresh seed */
  }
  return seed.map((s) => ({ ...s }));
}

let walletLedger: WalletTransaction[] = load(WALLET_DB_KEY, seedWalletLedger);
let coinLedger: CoinTransaction[] = load(COIN_DB_KEY, seedCoinLedger);

const saveWallet = () => {
  try {
    localStorage.setItem(WALLET_DB_KEY, JSON.stringify(walletLedger));
  } catch {
    /* storage blocked — state still lives in memory this session */
  }
};
const saveCoins = () => {
  try {
    localStorage.setItem(COIN_DB_KEY, JSON.stringify(coinLedger));
  } catch {
    /* storage blocked */
  }
};

const now = () => new Date().toISOString();
let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${seq++}`;

// ── Derived reads (balance = SUM of ledger; never stored) ────────────────────
export const walletBalanceOf = (userId: string) =>
  walletLedger
    .filter((t) => t.userId === userId)
    .reduce((s, t) => s + t.amount, 0);

export const coinBalanceOf = (userId: string) =>
  coinLedger.filter((t) => t.userId === userId).reduce((s, t) => s + t.amount, 0);

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

export const walletTransactionsOf = (userId: string) =>
  walletLedger.filter((t) => t.userId === userId).sort(byNewest);

export const coinTransactionsOf = (userId: string) =>
  coinLedger.filter((t) => t.userId === userId).sort(byNewest);

export function coinSummaryOf(userId: string): CoinSummary {
  const balance = coinBalanceOf(userId);
  const nowMs = Date.now();
  const windowMs = COIN_EXPIRING_SOON_DAYS * 86_400_000;
  const upcoming = coinLedger
    .filter((t) => t.userId === userId && t.type === "earn" && t.expiresAt)
    .map((t) => ({ amount: t.amount, at: t.expiresAt! }))
    .filter((e) => {
      const d = new Date(e.at).getTime();
      return d > nowMs && d - nowMs <= windowMs;
    })
    .sort((a, b) => a.at.localeCompare(b.at));
  const expiringSoon = Math.min(
    balance,
    upcoming.reduce((s, e) => s + e.amount, 0)
  );
  return { balance, expiringSoon, nextExpiryAt: upcoming[0]?.at };
}

// ── The seam: every money/points movement goes through here ──────────────────
export const paymentProvider: PaymentProvider = {
  hold() {
    // Self-custody: the client's money sits in platform escrow, tracked by the
    // booking status ("held") in handlers — no wallet-ledger entry for it yet.
  },

  release({ bookingId, recipients }) {
    for (const r of recipients) {
      walletLedger = [
        {
          id: uid("wt"),
          userId: r.payeeId,
          type: "payout",
          amount: r.amount,
          status: "completed",
          bookingId,
          createdAt: now(),
          note: "Giải ngân buổi chụp",
        },
        ...walletLedger,
      ];
    }
    saveWallet();
  },

  refund({ bookingId, clientId, amount }) {
    if (amount <= 0) return;
    walletLedger = [
      {
        id: uid("wt"),
        userId: clientId,
        type: "refund",
        amount,
        status: "completed",
        bookingId,
        createdAt: now(),
        note: "Hoàn tiền huỷ buổi chụp",
      },
      ...walletLedger,
    ];
    saveWallet();
  },

  withdraw({ userId, amount }) {
    walletLedger = [
      {
        id: uid("wt"),
        userId,
        type: "withdraw",
        amount: -Math.abs(amount),
        status: "completed",
        createdAt: now(),
        note: "Rút tiền về ngân hàng",
      },
      ...walletLedger,
    ];
    saveWallet();
  },

  creditCoins({ userId, amount, bookingId, expiresAt, note }) {
    if (amount <= 0) return;
    coinLedger = [
      {
        id: uid("ct"),
        userId,
        type: "earn",
        amount: Math.abs(amount),
        bookingId,
        createdAt: now(),
        expiresAt,
        note: note ?? "Hoàn xu buổi chụp",
      },
      ...coinLedger,
    ];
    saveCoins();
  },

  debitCoins({ userId, amount, bookingId, note }) {
    if (amount <= 0) return;
    coinLedger = [
      {
        id: uid("ct"),
        userId,
        type: "redeem",
        amount: -Math.abs(amount),
        bookingId,
        createdAt: now(),
        note: note ?? "Dùng xu cho buổi chụp",
      },
      ...coinLedger,
    ];
    saveCoins();
  },
};
