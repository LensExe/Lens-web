import type { LucideIcon } from "lucide-react";
import { Banknote, Landmark, PlusCircle, ReceiptText, RotateCcw } from "lucide-react";
import { Skeleton, cn, formatPrice } from "@lens/ui";
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
const dateOf = (iso: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
const monthOf = (iso: string) => new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(iso));

export function TransactionHistory({ money, loading }: { money: WalletTransaction[]; loading: boolean }) {
  const groups: { month: string; rows: WalletTransaction[] }[] = [];
  for (const transaction of money) {
    const month = monthOf(transaction.createdAt);
    const current = groups[groups.length - 1];
    if (current?.month === month) current.rows.push(transaction);
    else groups.push({ month, rows: [transaction] });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {loading ? <div className="space-y-2 p-4 sm:p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        : groups.length === 0 ? <div className="flex flex-col items-center px-6 py-12 text-center"><span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><ReceiptText className="size-6" /></span><p className="font-medium">Chưa có giao dịch ví</p><p className="mt-1 max-w-xs text-sm text-muted-foreground">Lịch sử biến động ví sẽ hiển thị tại đây.</p></div>
          : groups.map((group) => <div key={group.month}><p className="bg-muted/35 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-5">{group.month}</p><ul className="divide-y divide-border">{group.rows.map((transaction) => {
            const Icon = ICON[transaction.type];
            const positive = transaction.amount > 0;
            return <li key={transaction.id} className="flex items-center gap-3 px-4 py-4 sm:px-5"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", positive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-300" : "bg-muted text-muted-foreground")}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{LABEL[transaction.type]}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{transaction.note || dateOf(transaction.createdAt)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{dateOf(transaction.createdAt)}</p></div><p className={cn("shrink-0 text-sm font-semibold tabular-nums", positive && "text-emerald-700 dark:text-emerald-300")}>{positive ? "+" : "−"}{formatPrice(Math.abs(transaction.amount))}</p></li>;
          })}</ul></div>)}
    </section>
  );
}
