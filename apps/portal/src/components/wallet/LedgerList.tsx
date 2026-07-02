import { CoinsIcon, ReceiptText } from "lucide-react";
import { cn, formatPrice } from "@lens/ui";
import { COIN_TX_META, WALLET_TX_META, formatCoins } from "@/lib/wallet";
import type { CoinTransaction, WalletTransaction } from "@/types";

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

function EmptyLedger({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ReceiptText className="size-6" />
      </span>
      <p className="font-medium">{label}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Các giao dịch sẽ xuất hiện ở đây sau khi có phát sinh.
      </p>
    </div>
  );
}

function Row({
  label,
  className,
  note,
  createdAt,
  amount,
}: {
  label: string;
  className: string;
  note: string;
  createdAt: string;
  /** Pre-formatted signed amount string, e.g. "+405.000 ₫". */
  amount: string;
}) {
  const positive = amount.startsWith("+");
  return (
    <li className="flex items-center gap-3 border-b border-border py-3 last:border-0">
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
          className
        )}
      >
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{note}</p>
        <p className="text-xs text-muted-foreground">{fmtDateTime(createdAt)}</p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
        )}
      >
        {amount}
      </span>
    </li>
  );
}

export function WalletLedgerList({ items }: { items: WalletTransaction[] }) {
  if (items.length === 0)
    return <EmptyLedger label="Chưa có giao dịch tiền nào" />;
  return (
    <ul>
      {items.map((t) => {
        const meta = WALLET_TX_META[t.type];
        const sign = t.amount >= 0 ? "+" : "−";
        return (
          <Row
            key={t.id}
            label={meta.label}
            className={meta.className}
            note={t.note}
            createdAt={t.createdAt}
            amount={`${sign}${formatPrice(Math.abs(t.amount))}`}
          />
        );
      })}
    </ul>
  );
}

export function CoinLedgerList({ items }: { items: CoinTransaction[] }) {
  if (items.length === 0)
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <CoinsIcon className="size-6" />
        </span>
        <p className="font-medium">Chưa có giao dịch xu nào</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Hoàn tất một buổi chụp để nhận Lens Xu hoàn lại.
        </p>
      </div>
    );
  return (
    <ul>
      {items.map((t) => {
        const meta = COIN_TX_META[t.type];
        const sign = t.amount >= 0 ? "+" : "−";
        return (
          <Row
            key={t.id}
            label={meta.label}
            className={meta.className}
            note={t.note}
            createdAt={t.createdAt}
            amount={`${sign}${formatCoins(Math.abs(t.amount))}`}
          />
        );
      })}
    </ul>
  );
}
