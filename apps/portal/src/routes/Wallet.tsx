import {
  ArrowDownLeft,
  ArrowRight,
  Clock3,
  Gift,
  Landmark,
  RotateCcw,
  ShieldCheck,
  Ticket,
  TrendingUp,
  WalletMinimal,
} from "lucide-react";
import { Button, PageContainer, PageHeader, Skeleton, formatPrice, toast } from "@lens/ui";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { WalletSummaryCard } from "@/components/wallet/WalletSummaryCard";
import {
  useCoinSummary,
  useCoinTransactions,
  useWalletSummary,
  useWalletTransactions,
} from "@/queries/useWallet";
import { currentUser } from "@/lib/session";
import { COIN_LABEL, formatXu } from "@/lib/wallet";

// Balances on top, a few numbers that explain them, then one history.
export function Wallet() {
  const isPhotographer = currentUser.role === "photographer";
  const walletSummary = useWalletSummary();
  const walletTx = useWalletTransactions();
  const coinSummary = useCoinSummary();
  const coinTx = useCoinTransactions();

  const wallet = walletSummary.data;
  const coins = coinSummary.data;
  const stats =
    wallet && coins
      ? isPhotographer
        ? [
            {
              label: "Đang chờ giải ngân",
              value: formatPrice(wallet.pendingPayout),
              hint: `${wallet.pendingPayoutCount} buổi chờ khách xác nhận nhận ảnh`,
              icon: Clock3,
            },
            { label: "Đã nhận tháng này", value: formatPrice(wallet.receivedThisMonth), icon: TrendingUp },
            { label: "Đã rút về ngân hàng", value: formatPrice(wallet.withdrawnTotal), icon: Landmark },
          ]
        : [
            { label: "Đã hoàn về ví", value: formatPrice(wallet.refundedTotal), icon: RotateCcw },
            { label: "Xu đã nhận", value: formatXu(coins.earnedTotal), icon: Gift },
            { label: "Xu đã dùng", value: formatXu(coins.redeemedTotal), icon: Ticket },
          ]
      : null;

  return (
    <PageContainer className="max-w-[1280px]">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-6xl"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-ember/15 bg-ember/10 text-ember">
              <WalletMinimal className="size-5" />
            </span>
            <span>Ví của tôi</span>
          </span>
        }
        description={`Số dư tiền, ${COIN_LABEL} và lịch sử giao dịch của bạn.`}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Hệ thống ví được bảo vệ 24/7
          </span>
        }
      />

      {walletSummary.isError || coinSummary.isError ? (
        <p className="mx-auto w-full max-w-6xl rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Không tải được số dư. Vui lòng tải lại trang.
        </p>
      ) : !wallet || !coins ? (
        <div className="mx-auto grid w-full max-w-6xl gap-3 lg:grid-cols-2">
          <Skeleton className="h-[230px] rounded-2xl" />
          <Skeleton className="h-[230px] rounded-2xl" />
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl">
          <WalletSummaryCard wallet={wallet} coins={coins} canWithdraw={isPhotographer} />
        </div>
      )}

      {stats ? (
        <dl className="mx-auto mt-3 grid w-full max-w-6xl gap-3 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon;

            return (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                </div>
                <dd className="mt-2 text-base font-bold tabular-nums sm:text-lg">{s.value}</dd>
                {s.hint && <dd className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{s.hint}</dd>}
              </div>
            );
          })}
        </dl>
      ) : (
        <Skeleton className="mx-auto mt-3 h-24 w-full max-w-6xl rounded-2xl" />
      )}

      <div className="mx-auto mt-9 w-full max-w-6xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ArrowDownLeft className="size-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
              <p className="hidden text-xs text-muted-foreground sm:block">Theo dõi tiền và {COIN_LABEL.toLowerCase()} của bạn</p>
            </div>
          </div>
        </div>
        <TransactionHistory
          money={walletTx.data ?? []}
          coins={coinTx.data ?? []}
          loading={walletTx.isLoading || coinTx.isLoading}
        />
      </div>

      <section className="mx-auto mt-4 flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-card p-3.5 shadow-xs dark:border-emerald-900/60 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold">Lens Safe 100% Protection</p>
            <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
              Tài khoản và số dư của bạn được bảo hộ độc lập bởi chính sách cam kết chất lượng dịch vụ.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full rounded-lg px-3 text-[10px] sm:w-auto"
          onClick={() => toast("Thông tin cơ chế Lens Safe sẽ sớm được cập nhật")}
        >
          Tìm hiểu cơ chế Lens Safe
          <ArrowRight className="size-3" />
        </Button>
      </section>
    </PageContainer>
  );
}
