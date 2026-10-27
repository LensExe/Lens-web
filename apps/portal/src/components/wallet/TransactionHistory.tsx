import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Landmark,
  PlusCircle,
  ReceiptText,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton, cn, formatPrice } from "@lens/ui";
import { sessionUser } from "@/lib/session";
import type { WalletTransaction } from "@/types";

const ICON: Record<WalletTransaction["type"], LucideIcon> = {
  payout: Banknote,
  refund: RotateCcw,
  withdraw: Landmark,
  topup: PlusCircle,
  booking: ReceiptText,
};
const LABEL: Record<WalletTransaction["type"], string> = {
  payout: "Giải ngân",
  refund: "Hoàn tiền",
  withdraw: "Rút tiền",
  topup: "Nạp tiền",
  booking: "Thanh toán booking",
};
const ENTRY_LABEL: Record<string, string> = {
  topup: "Nạp tiền vào số dư khả dụng",
  booking_payment: "Thanh toán booking",
  booking_escrow_hold: "Tiền booking đang được giữ",
  booking_escrow_release: "Tiền booking về số dư khả dụng",
  refund_reserve: "Tiền hoàn booking chuyển vào khoản đang giữ",
  refund_credit: "Tiền hoàn vào số dư khả dụng",
  refund_debit: "Hoàn tiền từ số dư đang giữ",
  withdrawal_reserve: "Tiền rút chuyển vào khoản đang giữ",
  withdrawal_paid: "Rút tiền hoàn tất",
  withdrawal_release: "Tiền rút trả về số dư khả dụng",
};
const BOOKING_STATUS: Record<string, string> = {
  pending: "Chờ xác nhận",
  accepted: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  shot: "Đã chụp",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  rejected: "Đã từ chối",
  expired: "Đã hết hạn",
};
const TRANSACTION_STATUS: Record<string, string> = {
  paid: "Đã thanh toán",
  pending: "Đang xử lý",
  failed: "Thất bại",
};
const PAYMENT_METHOD: Record<string, string> = {
  payos: "PayOS",
  sepay: "SePay",
  wallet_internal: "Ví Lens",
  bank_transfer: "Chuyển khoản ngân hàng",
};
const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso),
  );
const monthOf = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(iso));
const signedPrice = (amount: number) => `${amount > 0 ? "+" : "−"}${formatPrice(Math.abs(amount))}`;

function bookingPeriod(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return "";
  const startTime = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
    start,
  );
  const endTime = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(
    end,
  );
  return `${dateOf(from)} · ${startTime}–${endTime}`;
}

function balanceChanges(transaction: WalletTransaction) {
  const changes: string[] = [];
  if (transaction.availableDelta)
    changes.push(`Khả dụng ${signedPrice(transaction.availableDelta)}`);
  if (transaction.frozenDelta) changes.push(`Đang giữ ${signedPrice(transaction.frozenDelta)}`);
  return changes.join(" · ");
}

function displayedAmount(transaction: WalletTransaction) {
  const { entryType, amount, availableDelta = 0, frozenDelta = 0 } = transaction;
  if (["booking_escrow_hold", "refund_reserve", "withdrawal_reserve"].includes(entryType ?? "")) {
    return { label: `Đang giữ ${formatPrice(Math.abs(frozenDelta || amount))}`, muted: true };
  }
  if (["booking_escrow_release", "withdrawal_release"].includes(entryType ?? "")) {
    return {
      label: `Về khả dụng ${formatPrice(Math.abs(availableDelta || amount))}`,
      muted: false,
    };
  }
  return {
    label: `${amount > 0 ? "+" : "−"}${formatPrice(Math.abs(amount))}`,
    muted: false,
  };
}

function BookingReference({ transaction }: { transaction: WalletTransaction }) {
  const booking = transaction.booking;
  if (!booking) return null;

  const detailPath =
    sessionUser?.role !== "client"
      ? `/dashboard/bookings/${encodeURIComponent(booking.id)}`
      : `/client/bookings/${encodeURIComponent(booking.id)}`;
  const status = BOOKING_STATUS[booking.status] ?? booking.status;
  const period = bookingPeriod(booking.from, booking.to);
  const paymentMethod = transaction.paymentGateway
    ? (PAYMENT_METHOD[transaction.paymentGateway] ?? transaction.paymentGateway)
    : "";
  const paymentStatus = transaction.transactionStatus
    ? (TRANSACTION_STATUS[transaction.transactionStatus] ?? transaction.transactionStatus)
    : "";

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Booking liên quan
          </p>
          <p className="mt-1 text-xs font-medium text-foreground">
            {booking.packageName || "Buổi chụp"}
          </p>
        </div>
        <span className="rounded-full bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
          {status}
        </span>
      </div>
      {period && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" />
          {period}
        </p>
      )}
      <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
        ID booking: {booking.id}
      </p>
      {(transaction.transactionCode || paymentMethod || paymentStatus) && (
        <div className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
          {transaction.transactionCode && (
            <p className="break-all">
              Mã giao dịch: <span className="font-mono">{transaction.transactionCode}</span>
            </p>
          )}
          {(paymentMethod || paymentStatus) && (
            <p>{[paymentMethod, paymentStatus].filter(Boolean).join(" · ")}</p>
          )}
        </div>
      )}
      <Link
        to={detailPath}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ember hover:underline"
      >
        Mở booking
        <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function TransactionHistory({
  money,
  loading,
}: {
  money: WalletTransaction[];
  loading: boolean;
}) {
  const groups: { month: string; rows: WalletTransaction[] }[] = [];
  for (const transaction of money) {
    const month = monthOf(transaction.createdAt);
    const current = groups[groups.length - 1];
    if (current?.month === month) current.rows.push(transaction);
    else groups.push({ month, rows: [transaction] });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {loading ? (
        <div className="space-y-2 p-4 sm:p-5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ReceiptText className="size-6" />
          </span>
          <p className="font-medium">Chưa có giao dịch ví</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Lịch sử biến động ví sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.month}>
            <p className="bg-muted/35 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-5">
              {group.month}
            </p>
            <ul className="divide-y divide-border">
              {group.rows.map((transaction) => {
                const Icon = ICON[transaction.type];
                const walletImpact =
                  transaction.availableDelta !== undefined || transaction.frozenDelta !== undefined
                    ? (transaction.availableDelta ?? 0) + (transaction.frozenDelta ?? 0)
                    : transaction.amount;
                const positive = walletImpact > 0;
                const title = ENTRY_LABEL[transaction.entryType ?? ""] ?? LABEL[transaction.type];
                const detail =
                  balanceChanges(transaction) || transaction.note || dateOf(transaction.createdAt);
                const amountDisplay = displayedAmount(transaction);

                return (
                  <li key={transaction.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
                    <span
                      className={cn(
                        "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl",
                        positive
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{title}</p>
                        <p
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            positive &&
                              !amountDisplay.muted &&
                              "text-emerald-700 dark:text-emerald-300",
                            amountDisplay.muted && "text-muted-foreground",
                          )}
                        >
                          {amountDisplay.label}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {dateOf(transaction.createdAt)}
                      </p>
                      <BookingReference transaction={transaction} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
