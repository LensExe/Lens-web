import { CalendarPlus, Clock3, Coins, Gift, HelpCircle, Landmark, WalletMinimal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Popover, PopoverContent, PopoverTrigger, toast } from "@lens/ui";
import { WithdrawDialog } from "@/components/wallet/WithdrawDialog";
import {
  CASHBACK_RATE,
  COIN_EXPIRY_MONTHS,
  COIN_LABEL,
  COIN_REDEEM_CAP_RATE,
  formatXu,
} from "@/lib/wallet";
import type { CoinSummary, WalletSummary } from "@/types";

const number = (n: number) => new Intl.NumberFormat("vi-VN").format(n);
const dayMonth = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Balanced balance overview — money is primary, Lens Xu is secondary, and
 * both panels keep the same visual weight across screen sizes. */
export function WalletSummaryCard({
  wallet,
  coins,
  canWithdraw,
}: {
  wallet: WalletSummary;
  coins: CoinSummary;
  canWithdraw: boolean;
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-[1.12fr_0.88fr]">
      <div className="flex min-h-[230px] flex-col rounded-2xl border border-border border-t-2 border-t-foreground/80 bg-card p-4 shadow-xs sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <WalletMinimal className="size-4" />
            </span>
            Ví tiền
          </p>
          <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
            Số dư khả dụng
          </span>
        </div>
        <div className="mt-5">
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-4xl font-bold tracking-tight tabular-nums sm:text-[2.75rem]">{number(wallet.balance)}</span>
            <span className="text-lg font-semibold text-muted-foreground underline decoration-muted-foreground/40 underline-offset-2">₫</span>
          </p>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            {canWithdraw
              ? "Tiền giải ngân sau khi khách xác nhận đã nhận đủ ảnh. Bạn có thể rút về ngân hàng bất cứ lúc nào."
              : "Tiền hoàn từ các lịch đã huỷ sẽ được cộng vào ví của bạn."}
          </p>
        </div>
        <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-[1.35fr_1fr]">
          <Button asChild size="sm" className="h-8 rounded-lg bg-ember text-[10px] text-white hover:bg-ember/90">
            <Link to="/">
              <CalendarPlus className="size-3.5" />
              Dùng thanh toán lịch mới
            </Link>
          </Button>
          {canWithdraw ? (
            <WithdrawDialog
              balance={wallet.balance}
              label="Rút tiền về ngân hàng"
              className="h-8 w-full rounded-lg border-border text-[10px]"
            />
          ) : (
            <Button variant="outline" size="sm" disabled className="h-8 rounded-lg text-[10px]">
              <Landmark className="size-3.5" />
              Rút tiền về ngân hàng
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-[230px] flex-col rounded-2xl border border-border border-t-2 border-t-ember/60 bg-card p-4 shadow-xs sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-ember/10 text-ember">
              <Coins className="size-4" />
            </span>
            {COIN_LABEL}
          </p>
          <Popover>
            <PopoverTrigger className="focus-ring flex items-center gap-1 rounded-full text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              <HelpCircle className="size-3.5" />
              Cách dùng
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-2xl">
              <p className="text-sm font-semibold">{COIN_LABEL} hoạt động thế nào?</p>
              <ul className="mt-2.5 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Gift className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Nhận {Math.round(CASHBACK_RATE * 100)}% hoàn xu trên số tiền mặt của mỗi buổi chụp hoàn thành.
                </li>
                <li className="flex items-start gap-2">
                  <WalletMinimal className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Dùng xu để trừ tối đa {Math.round(COIN_REDEEM_CAP_RATE * 100)}% giá trị mỗi đơn khi thanh toán.
                </li>
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Xu hết hạn sau {COIN_EXPIRY_MONTHS} tháng kể từ ngày nhận.
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
        <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-4xl font-bold tracking-tight tabular-nums sm:text-[2.75rem]">{number(coins.balance)}</span>
          <span className="text-lg font-semibold text-muted-foreground">xu</span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">1 xu = 1 ₫ khi thanh toán buổi chụp.</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          {coins.expiringSoon > 0 ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-800 dark:border-amber-900/70 dark:bg-amber-500/15 dark:text-amber-300">
              <Clock3 className="size-3.5 shrink-0" />
              <span className="truncate">{formatXu(coins.expiringSoon)} hết hạn ngày {dayMonth(coins.nextExpiryAt)}</span>
            </span>
          ) : (
            <p className="text-[10px] text-muted-foreground">Không có xu sắp hết hạn.</p>
          )}
          <button
            type="button"
            className="focus-ring shrink-0 text-[10px] font-medium text-ember hover:underline"
            onClick={() => toast("Mở mục Cách dùng để xem điều kiện sử dụng Lens Xu")}
          >
            Xem điều kiện
          </button>
        </div>
      </div>
    </section>
  );
}
