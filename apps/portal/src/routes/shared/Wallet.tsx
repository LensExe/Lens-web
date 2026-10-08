import { ArrowDownLeft, WalletMinimal } from "lucide-react";
import { PageContainer, PageHeader, Skeleton } from "@lens/ui";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { WalletSummaryCard } from "@/components/wallet/WalletSummaryCard";
import { useWalletSummary, useWalletTransactions } from "@/queries/useWallet";

export function Wallet() {
  const wallet = useWalletSummary();
  const ledger = useWalletTransactions();
  return (
    <PageContainer className="max-w-[1280px] py-6">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-6xl"
        title={<span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-ember/15 bg-ember/10 text-ember"><WalletMinimal className="size-5" /></span>Ví của tôi</span>}
        description="Số dư và lịch sử giao dịch lấy từ wallet API của Lens."
      />
      <div className="mx-auto w-full max-w-6xl">
        {wallet.isError ? <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Không tải được số dư ví từ backend.</p>
          : wallet.isLoading || !wallet.data ? <Skeleton className="h-56 rounded-2xl" />
            : <WalletSummaryCard wallet={wallet.data} />}
      </div>
      <div className="mx-auto mt-9 w-full max-w-6xl">
        <div className="mb-3 flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"><ArrowDownLeft className="size-4" /></span><div><h2 className="text-lg font-semibold">Lịch sử giao dịch</h2><p className="text-xs text-muted-foreground">Wallet ledger do backend trả về</p></div></div>
        {ledger.isError ? <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Không tải được lịch sử giao dịch ví.</p>
          : <TransactionHistory money={ledger.data ?? []} loading={ledger.isLoading} />}
      </div>
    </PageContainer>
  );
}
