import { CalendarPlus, Landmark, WalletMinimal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, formatPrice } from "@lens/ui";
import { WithdrawDialog } from "@/components/wallet/WithdrawDialog";
import type { WalletSummary } from "@/types";

export function WalletSummaryCard({ wallet }: { wallet: WalletSummary }) {
  return (
    <section className="rounded-2xl border border-border border-t-2 border-t-foreground/80 bg-card p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground"><WalletMinimal className="size-4" /></span>
        Ví Lens
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div><p className="text-xs text-muted-foreground">Số dư khả dụng</p><p className="mt-1 text-3xl font-bold tabular-nums">{formatPrice(wallet.balance)}</p></div>
        <div><p className="text-xs text-muted-foreground">Số dư đang giữ</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatPrice(wallet.frozenBalance)}</p></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Số dư đang giữ không thể rút cho đến khi booking hoặc yêu cầu liên quan được xử lý.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm" className="rounded-lg"><Link to="/"><CalendarPlus className="size-3.5" /> Tìm lịch chụp</Link></Button>
        <WithdrawDialog balance={wallet.balance} label="Yêu cầu rút tiền" className="rounded-lg" />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Landmark className="size-3.5" /> Yêu cầu rút tiền sẽ được admin xử lý.</p>
    </section>
  );
}
