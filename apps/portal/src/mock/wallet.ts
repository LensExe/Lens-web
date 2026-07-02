import type { CoinTransaction, WalletTransaction } from "@/types";

// Seed for the two append-only ledgers. Imported ONLY by src/msw/payments.ts.
// Demo accounts: client "u-khachhang", photographer "me" (see lib/session.ts).

const isoAt = (daysFromNow: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

// Client earned Lens Xu from past completed shoots. One batch expires soon so the
// "sắp hết hạn" warning is demonstrable. Balance = 24k + 36k − 10k = 50.000 xu.
export const seedCoinLedger: CoinTransaction[] = [
  {
    id: "ct-1",
    userId: "u-khachhang",
    type: "earn",
    amount: 24_000,
    bookingId: "bk-tkh-4",
    createdAt: isoAt(-300),
    expiresAt: isoAt(65),
    note: "Hoàn xu buổi chụp Chân dung",
  },
  {
    id: "ct-2",
    userId: "u-khachhang",
    type: "earn",
    amount: 36_000,
    createdAt: isoAt(-340),
    expiresAt: isoAt(25),
    note: "Hoàn xu buổi chụp Ẩm thực",
  },
  {
    id: "ct-3",
    userId: "u-khachhang",
    type: "redeem",
    amount: -10_000,
    createdAt: isoAt(-40),
    note: "Dùng xu cho buổi chụp",
  },
];

// Photographer "me" real-money earnings + one client refund. Balance for "me" =
// 405k + 495k − 500k = 400.000 ₫.
export const seedWalletLedger: WalletTransaction[] = [
  {
    id: "wt-1",
    userId: "me",
    type: "payout",
    amount: 405_000,
    status: "completed",
    bookingId: "in-5",
    createdAt: isoAt(-9),
    note: "Giải ngân buổi chụp Chân dung",
  },
  {
    id: "wt-2",
    userId: "me",
    type: "payout",
    amount: 495_000,
    status: "completed",
    createdAt: isoAt(-30),
    note: "Giải ngân buổi chụp Gia đình",
  },
  {
    id: "wt-3",
    userId: "me",
    type: "withdraw",
    amount: -500_000,
    status: "completed",
    createdAt: isoAt(-20),
    note: "Rút tiền về ngân hàng",
  },
  {
    id: "wt-4",
    userId: "u-khachhang",
    type: "refund",
    amount: 400_000,
    status: "completed",
    bookingId: "bk-tkh-5",
    createdAt: isoAt(-32),
    note: "Hoàn tiền huỷ buổi chụp Ẩm thực",
  },
];
