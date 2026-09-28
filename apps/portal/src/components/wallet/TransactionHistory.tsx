import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Gift,
  Hourglass,
  Landmark,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import { Skeleton, StatusTabs, cn, formatPrice, toast } from "@lens/ui";
import { COIN_TX_LABEL, WALLET_TX_LABEL, formatXu } from "@/lib/wallet";
import type { CoinTransaction, WalletTransaction } from "@/types";

type Ledger = "money" | "coins";
type Direction = "all" | "in" | "out";

const ICON: Record<WalletTransaction["type"] | CoinTransaction["type"], LucideIcon> = {
  payout: Banknote,
  refund: RotateCcw,
  withdraw: Landmark,
  topup: PlusCircle,
  earn: Gift,
  redeem: Ticket,
  expire: Hourglass,
  adjust: SlidersHorizontal,
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateOf = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const monthOf = (iso: string) => {
  const d = new Date(iso);
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
};

interface Row {
  id: string;
  type: WalletTransaction["type"] | CoinTransaction["type"];
  label: string;
  note: string;
  createdAt: string;
  amount: number;
  extra?: string;
}

/**
 * Wallet + Lens Xu history in one card: switch ledger, filter money in / out,
 * rows grouped by month. Direction is carried by the sign and a green "+";
 * everything else stays neutral.
 */
export function TransactionHistory({
  money,
  coins,
  loading,
}: {
  money: WalletTransaction[];
  coins: CoinTransaction[];
  loading: boolean;
}) {
  const [ledger, setLedger] = useState<Ledger>("money");
  const [direction, setDirection] = useState<Direction>("all");

  const rows: Row[] =
    ledger === "money"
      ? money.map((t) => ({
          id: t.id,
          type: t.type,
          label: WALLET_TX_LABEL[t.type],
          note: t.note,
          createdAt: t.createdAt,
          amount: t.amount,
          extra: t.status === "pending" ? "Đang xử lý" : undefined,
        }))
      : coins.map((t) => ({
          id: t.id,
          type: t.type,
          label: COIN_TX_LABEL[t.type],
          note: t.note,
          createdAt: t.createdAt,
          amount: t.amount,
          extra: t.expiresAt ? `Hết hạn ${dateOf(t.expiresAt)}` : undefined,
        }));
  const visible = rows.filter((r) => (direction === "in" ? r.amount > 0 : direction === "out" ? r.amount < 0 : true));

  // Newest first, grouped under a month heading.
  const groups: { month: string; rows: Row[] }[] = [];
  for (const r of visible) {
    const month = monthOf(r.createdAt);
    const last = groups[groups.length - 1];
    if (last?.month === month) last.rows.push(r);
    else groups.push({ month, rows: [r] });
  }
  const format = (n: number) => (ledger === "money" ? formatPrice(Math.abs(n)) : formatXu(Math.abs(n)));

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-col gap-3 border-b border-border bg-muted/15 px-4 pt-3 sm:px-5 md:flex-row md:items-end md:justify-between">
        <StatusTabs
          className="mx-0 border-b-0 px-0 md:px-0"
          value={ledger}
          onChange={setLedger}
          tabs={[
            { value: "money", label: "Tiền", count: money.length },
            { value: "coins", label: "Lens Xu", count: coins.length },
          ]}
        />
        <div role="radiogroup" aria-label="Lọc giao dịch" className="mb-3 grid w-full grid-cols-3 gap-1 rounded-full bg-muted p-1 text-xs sm:w-auto sm:text-sm">
          {(
            [
              { value: "all", label: "Tất cả" },
              { value: "in", label: "Tiền vào" },
              { value: "out", label: "Tiền ra" },
            ] as const
          ).map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={direction === o.value}
              onClick={() => setDirection(o.value)}
              className={cn(
                "focus-ring rounded-full px-2.5 py-1.5 font-medium transition-colors sm:px-3 sm:py-1",
                direction === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

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
          <p className="font-medium">Chưa có giao dịch nào</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {ledger === "coins"
              ? "Hoàn tất một buổi chụp để nhận Lens Xu hoàn lại."
              : "Các khoản giải ngân, hoàn tiền và rút tiền sẽ hiện ở đây."}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((g) => (
            <div key={g.month}>
              <p className="bg-muted/35 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:px-5">
                {g.month}
              </p>
              <ul className="divide-y divide-border">
                {g.rows.map((r) => {
                  const Icon = ICON[r.type];
                  const plus = r.amount > 0;
                  return (
                    <li key={r.id} className="group flex gap-3 px-4 py-4 transition-colors hover:bg-muted/20 sm:items-center sm:gap-4 sm:px-5">
                      <span
                        className={cn(
                          "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl sm:mt-0",
                          plus
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-300"
                            : r.type === "redeem" || r.type === "withdraw"
                              ? "bg-orange-50 text-orange-600 dark:bg-orange-950/35 dark:text-orange-300"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.note}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.label} · {dateOf(r.createdAt)}
                        </p>
                        {r.extra && (
                          <span className="mt-1 inline-flex max-w-full rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {r.extra}
                          </span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 self-start pt-0.5 text-right text-sm font-semibold tabular-nums sm:self-center sm:pt-0",
                          plus ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                        )}
                      >
                        {plus ? "+" : "−"}
                        {format(r.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <p className="border-t border-border bg-muted/10 px-4 py-3 text-center text-[10px] text-muted-foreground sm:px-5">
            Hiển thị tối đa các giao dịch trong vòng 180 ngày gần nhất. Cần tra cứu cũ hơn?{" "}
            <button type="button" className="font-medium text-ember hover:underline" onClick={() => toast("Lens Care sẽ hỗ trợ bạn sớm nhất")}>
              Liên hệ hỗ trợ
            </button>
          </p>
        </div>
      )}
    </section>
  );
}
