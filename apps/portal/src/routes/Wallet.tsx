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
            },
            { label: "Đã nhận tháng này", value: formatPrice(wallet.receivedThisMonth) },
            { label: "Đã rút về ngân hàng", value: formatPrice(wallet.withdrawnTotal) },
          ]
        : [
            { label: "Đã hoàn về ví", value: formatPrice(wallet.refundedTotal) },
            { label: "Xu đã nhận", value: formatXu(coins.earnedTotal) },
            { label: "Xu đã dùng", value: formatXu(coins.redeemedTotal) },
          ]
      : null;

  return (
    <PageContainer>
      <PageHeader title="Ví của tôi" description={`Số dư tiền, ${COIN_LABEL} và lịch sử giao dịch của bạn.`} />

      {walletSummary.isError || coinSummary.isError ? (
        <p className="rounded-2xl border border-border p-5 text-sm text-destructive">
          Không tải được số dư. Vui lòng tải lại trang.
        </p>
      ) : !wallet || !coins ? (
        <Skeleton className="h-52 rounded-3xl" />
      ) : (
        <WalletSummaryCard wallet={wallet} coins={coins} canWithdraw={isPhotographer} />
      )}

      {stats ? (
        <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-5 py-4">
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{s.value}</dd>
              {s.hint && <dd className="mt-0.5 text-xs text-muted-foreground">{s.hint}</dd>}
            </div>
          ))}
        </dl>
      ) : (
        <Skeleton className="mt-4 h-20 rounded-2xl" />
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Lịch sử giao dịch</h2>
        <TransactionHistory
          money={walletTx.data ?? []}
          coins={coinTx.data ?? []}
          loading={walletTx.isLoading || coinTx.isLoading}
        />
      </div>
    </PageContainer>
  );
}
