import { Clock3, Coins, Gift, HelpCircle, WalletMinimal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@lens/ui";
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
      <div className="flex min-h-[230px] flex-col rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
              <WalletMinimal className="size-4" />
            </span>
            Ví tiền
          </p>
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            Số dư khả dụng
          </span>
        </div>
        <div className="mt-7">
          <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{number(wallet.balance)}</span>
            <span className="text-lg font-semibold text-muted-foreground">₫</span>
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {canWithdraw
              ? "Tiền giải ngân sau khi khách xác nhận đã nhận đủ ảnh. Bạn có thể rút về ngân hàng bất cứ lúc nào."
              : "Tiền hoàn từ các lịch đã huỷ sẽ được cộng vào ví của bạn."}
          </p>
        </div>
        {canWithdraw && (
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            <WithdrawDialog balance={wallet.balance} />
            <span className="text-xs text-muted-foreground">Xử lý trong 1–2 ngày làm việc</span>
          </div>
        )}
      </div>

      <div className="flex min-h-[230px] flex-col rounded-3xl border border-border bg-muted/25 p-5 shadow-xs sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span className="flex size-9 items-center justify-center rounded-xl bg-background text-foreground">
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
        <p className="mt-7 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{number(coins.balance)}</span>
          <span className="text-lg font-semibold text-muted-foreground">xu</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">1 xu = 1 ₫ khi thanh toán buổi chụp.</p>
        <div className="mt-auto pt-6">
          {coins.expiringSoon > 0 ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <Clock3 className="size-3.5 shrink-0" />
              <span className="truncate">{formatXu(coins.expiringSoon)} hết hạn ngày {dayMonth(coins.nextExpiryAt)}</span>
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">Không có xu sắp hết hạn.</p>
          )}
        </div>
      </div>
    </section>
  );
}
