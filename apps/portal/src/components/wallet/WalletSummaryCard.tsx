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

/**
 * Both balances side by side on one card — money (with "Rút tiền" for
 * photographers) and Lens Xu (with the expiry warning and the rules one click
 * away). Neutral by design: the numbers are the content.
 */
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
    <section className="grid overflow-hidden rounded-3xl border border-border bg-card md:grid-cols-2 md:divide-x md:divide-border">
      <div className="flex flex-col p-6 md:p-7">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <WalletMinimal className="size-4" />
          Ví tiền
        </p>
        <p className="mt-3 flex items-baseline gap-1">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{number(wallet.balance)}</span>
          <span className="text-xl font-semibold">₫</span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {canWithdraw
            ? "Tiền giải ngân sau khi khách xác nhận đã nhận đủ ảnh. Rút về ngân hàng bất cứ lúc nào."
            : "Tiền hoàn từ các lịch đã huỷ nằm ở đây."}
        </p>
        {canWithdraw && (
          <div className="mt-auto pt-5">
            <WithdrawDialog balance={wallet.balance} />
          </div>
        )}
      </div>

      <div className="flex flex-col border-t border-border p-6 md:border-t-0 md:p-7">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="size-4" />
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
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight tabular-nums">{number(coins.balance)}</span>
          <span className="text-xl font-semibold">xu</span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">1 xu = 1 ₫ khi thanh toán buổi chụp.</p>
        {coins.expiringSoon > 0 && (
          <p className="mt-auto pt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <Clock3 className="size-3.5" />
              {formatXu(coins.expiringSoon)} hết hạn ngày {dayMonth(coins.nextExpiryAt)}
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
