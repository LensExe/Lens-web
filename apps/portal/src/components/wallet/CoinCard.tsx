import { Clock3, Coins } from "lucide-react";
import { CountUp } from "@lens/ui";
import { COIN_LABEL } from "@/lib/wallet";
import type { CoinSummary } from "@/types";

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

export function CoinCard({ summary }: { summary: CoinSummary }) {
  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-ember/10 to-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Coins className="size-4 text-ember" />
        {COIN_LABEL}
      </div>
      <p className="mt-3 flex items-baseline gap-2 text-4xl font-semibold tracking-tight tabular-nums">
        <CountUp to={summary.balance} separator="." />
        <span className="text-lg font-medium text-muted-foreground">xu</span>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        1 xu = 1 ₫ · Dùng để trừ tiền khi thanh toán buổi chụp.
      </p>

      {summary.expiringSoon > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-100 px-3 py-2.5 text-sm text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-semibold">{fmt(summary.expiringSoon)} xu</span>{" "}
            sắp hết hạn
            {summary.nextExpiryAt ? ` vào ${fmtDate(summary.nextExpiryAt)}` : ""}.
            Hãy dùng sớm nhé!
          </p>
        </div>
      )}
    </div>
  );
}
