import { Coins, WalletMinimal } from "lucide-react";
import { Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@lens/ui";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { CoinCard } from "@/components/wallet/CoinCard";
import { CoinLedgerList, WalletLedgerList } from "@/components/wallet/LedgerList";
import {
  useCoinSummary,
  useCoinTransactions,
  useWalletSummary,
  useWalletTransactions,
} from "@/queries/useWallet";
import { currentUser } from "@/lib/session";
import { COIN_LABEL } from "@/lib/wallet";

export function Wallet() {
  const isPhotographer = currentUser.role === "photographer";
  const walletSummary = useWalletSummary();
  const walletTx = useWalletTransactions();
  const coinSummary = useCoinSummary();
  const coinTx = useCoinTransactions();

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Ví của tôi
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý số dư tiền và {COIN_LABEL} của bạn.
        </p>
      </header>

      <Tabs defaultValue="wallet" className="mt-7">
        <TabsList>
          <TabsTrigger value="wallet">
            <WalletMinimal className="size-4" />
            Số dư ví
          </TabsTrigger>
          <TabsTrigger value="coins">
            <Coins className="size-4" />
            {COIN_LABEL}
          </TabsTrigger>
        </TabsList>

        {/* ── Real-money wallet ─────────────────────────────────────────── */}
        <TabsContent value="wallet" className="mt-5 space-y-6">
          {walletSummary.isLoading ? (
            <Skeleton className="h-44 rounded-3xl" />
          ) : walletSummary.isError ? (
            <p className="text-sm text-destructive">
              Không tải được số dư. Vui lòng thử lại.
            </p>
          ) : (
            <BalanceCard
              balance={walletSummary.data?.balance ?? 0}
              canWithdraw={isPhotographer}
            />
          )}

          <section>
            <h2 className="mb-2 text-base font-semibold">Lịch sử giao dịch</h2>
            {walletTx.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            ) : (
              <WalletLedgerList items={walletTx.data ?? []} />
            )}
          </section>
        </TabsContent>

        {/* ── Lens Xu ───────────────────────────────────────────────────── */}
        <TabsContent value="coins" className="mt-5 space-y-6">
          {coinSummary.isLoading ? (
            <Skeleton className="h-44 rounded-3xl" />
          ) : coinSummary.isError ? (
            <p className="text-sm text-destructive">
              Không tải được số xu. Vui lòng thử lại.
            </p>
          ) : (
            <CoinCard
              summary={coinSummary.data ?? { balance: 0, expiringSoon: 0 }}
            />
          )}

          <section>
            <h2 className="mb-2 text-base font-semibold">Lịch sử {COIN_LABEL}</h2>
            {coinTx.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            ) : (
              <CoinLedgerList items={coinTx.data ?? []} />
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
