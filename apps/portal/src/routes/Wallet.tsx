import {
  ArrowDownLeft,
  Clock3,
  Gift,
  Landmark,
  RotateCcw,
  Ticket,
  TrendingUp,
  WalletMinimal,
} from "lucide-react";
import { PageContainer, PageHeader, Skeleton, formatPrice } from "@lens/ui";
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
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <WalletMinimal className="size-5" />
            </span>
            <span>Ví của tôi</span>
          </span>
        }
        description={`Số dư tiền, ${COIN_LABEL} và lịch sử giao dịch của bạn.`}
      />

      {walletSummary.isError || coinSummary.isError ? (
        <p className="mx-auto w-full max-w-6xl rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Không tải được số dư. Vui lòng tải lại trang.
        </p>
      ) : !wallet || !coins ? (
        <Skeleton className="mx-auto h-[250px] w-full max-w-6xl rounded-3xl" />
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
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">{s.label}</dt>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                </div>
                <dd className="mt-3 text-lg font-semibold tabular-nums">{s.value}</dd>
                {s.hint && <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.hint}</dd>}
              </div>
            );
          })}
        </dl>
      ) : (
        <Skeleton className="mx-auto mt-3 h-24 w-full max-w-6xl rounded-2xl" />
      )}

      <div className="mx-auto mt-10 w-full max-w-6xl">
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
    </PageContainer>
  );
}
