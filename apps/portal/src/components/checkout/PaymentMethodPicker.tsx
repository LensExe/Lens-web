import { CreditCard, Landmark, QrCode, Smartphone } from "lucide-react";
import { cn, formatPrice } from "@lens/ui";
import { CopyField } from "./CopyField";
import { PAYMENT_METHODS, PLATFORM_BANK_ACCOUNT, transferMemo } from "@/lib/booking";
import type { PaymentMethod } from "@/types";

const METHOD_ICON: Record<PaymentMethod, typeof Landmark> = {
  bank: Landmark,
  card: CreditCard,
  momo: Smartphone,
};

/** Payment method cards + what to do for the selected one. */
export function PaymentMethodPicker({
  value,
  onChange,
  amount,
  bookingId,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  amount: number;
  bookingId: string;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold">Phương thức thanh toán</h2>

      <div role="radiogroup" aria-label="Phương thức thanh toán" className="mt-4 grid gap-3 sm:grid-cols-3">
        {PAYMENT_METHODS.map((m) => {
          const Icon = METHOD_ICON[m.id];
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(m.id)}
              className={cn(
                "focus-ring flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
                active
                  ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                  : "border-border hover:bg-muted/40"
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Instructions for the selected method (UI phase: sample details). */}
      <div className="mt-5 rounded-2xl bg-muted/40 p-4">
        {value === "bank" ? (
          <div className="grid items-center gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
            <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-background text-muted-foreground">
              <QrCode className="size-16 text-foreground" />
              <span className="text-[11px]">Mã QR mẫu</span>
            </div>
            <div className="divide-y divide-border">
              <CopyField label="Ngân hàng" value={PLATFORM_BANK_ACCOUNT.bank} />
              <CopyField label="Số tài khoản" value={PLATFORM_BANK_ACCOUNT.number} />
              <CopyField label="Chủ tài khoản" value={PLATFORM_BANK_ACCOUNT.holder} />
              <CopyField label="Số tiền" value={formatPrice(amount)} />
              <CopyField label="Nội dung chuyển khoản" value={transferMemo(bookingId)} />
            </div>
          </div>
        ) : value === "momo" ? (
          <div className="flex items-center gap-4">
            <div className="flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-background text-muted-foreground">
              <QrCode className="size-12 text-foreground" />
              <span className="text-[11px]">Mã QR mẫu</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Mở ứng dụng MoMo, quét mã để thanh toán{" "}
              <span className="font-medium text-foreground">{formatPrice(amount)}</span>, rồi
              bấm xác nhận bên cạnh.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Bạn sẽ được chuyển tới cổng thanh toán bảo mật để nhập thông tin thẻ Visa,
            Mastercard hoặc JCB. Lens không lưu thông tin thẻ của bạn.
          </p>
        )}
      </div>
    </section>
  );
}
