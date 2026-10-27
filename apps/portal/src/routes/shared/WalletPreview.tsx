import { ArrowDownLeft, WalletMinimal } from "lucide-react";
import { PageContainer, PageHeader } from "@lens/ui";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import type { WalletTransaction } from "@/types";

// Development-only view of the response shared while implementing the wallet page.
const sampleLedger: WalletTransaction[] = [
  {
    id: "bd6c442d-7689-4f7e-a7e2-eaa34e3e741b",
    userId: "preview-photographer",
    type: "booking",
    amount: 140_000,
    entryType: "booking_escrow_hold",
    availableDelta: 0,
    frozenDelta: 140_000,
    status: "completed",
    createdAt: "2026-10-26T05:19:51.141Z",
    note: "Booking funds held until booking completion",
    transactionCode: "remaining:107ac4a2-a3a6-44df-8aad-3af82b4af8fa",
    transactionStatus: "paid",
    paymentGateway: "payos",
    bookingId: "107ac4a2-a3a6-44df-8aad-3af82b4af8fa",
    booking: {
      id: "107ac4a2-a3a6-44df-8aad-3af82b4af8fa",
      status: "completed",
      from: "2026-10-26T04:30:00.000Z",
      to: "2026-10-26T05:30:00.000Z",
      packageName: "Chụp chân dung ngoại cảnh (Portrait Demo)",
    },
  },
];

export function WalletPreview() {
  return (
    <PageContainer className="max-w-[1280px] py-6">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-6xl"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl border border-ember/15 bg-ember/10 text-ember">
              <WalletMinimal className="size-5" />
            </span>
            Ví của tôi
          </span>
        }
        description="Bản xem trước lịch sử ví photographer với response booking bạn gửi."
      />
      <div className="mx-auto grid w-full max-w-6xl gap-3 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <p className="text-xs text-muted-foreground">Số dư khả dụng</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">850.000 ₫</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <p className="text-xs text-muted-foreground">Số dư đang giữ</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">140.000 ₫</p>
        </section>
      </div>
      <div className="mx-auto mt-8 w-full max-w-6xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ArrowDownLeft className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Lịch sử giao dịch</h2>
            <p className="text-xs text-muted-foreground">
              Mỗi mục cho biết giao dịch thuộc booking nào.
            </p>
          </div>
        </div>
        <TransactionHistory money={sampleLedger} loading={false} />
      </div>
    </PageContainer>
  );
}
