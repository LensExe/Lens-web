import { useEffect } from "react";
import { Banknote, Wallet } from "lucide-react";
import { cn, formatPrice } from "@lens/ui";
import { useWalletSummary } from "@/queries/useWallet";
import type { PaymentMethod } from "@/types";

export function PaymentMethodPicker({
  value,
  onChange,
  amount,
}: {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  amount: number;
}) {
  const wallet = useWalletSummary();
  const walletBalance = wallet.data?.balance ?? 0;
  const enoughInWallet = walletBalance >= amount;
  const walletUnavailable = wallet.isLoading || !wallet.data;

  useEffect(() => {
    if (value === "wallet" && (walletUnavailable || !enoughInWallet)) onChange("gateway");
  }, [enoughInWallet, onChange, value, walletUnavailable]);

  const methods = [
    {
      id: "gateway" as const,
      label: "QR / cổng thanh toán",
      hint: "Quét QR hoặc mở link checkout do backend tạo.",
      icon: Banknote,
      disabled: false,
    },
    {
      id: "wallet" as const,
      label: "Ví Lens",
      hint: wallet.isLoading
        ? "Đang kiểm tra số dư ví..."
        : !wallet.data
          ? "Không thể kiểm tra số dư ví."
          : enoughInWallet
            ? `Số dư khả dụng: ${formatPrice(walletBalance)}.`
            : `Số dư ${formatPrice(walletBalance)}; cần ${formatPrice(amount)}.`,
      icon: Wallet,
      disabled: walletUnavailable || !enoughInWallet,
    },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold">Phương thức thanh toán</h2>
      <div
        role="radiogroup"
        aria-label="Phương thức thanh toán"
        aria-required="true"
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        {methods.map((method) => {
          const Icon = method.icon;
          const active = value === method.id;
          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={method.disabled}
              onClick={() => onChange(method.id)}
              className={cn(
                "focus-ring flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <Icon className="size-5" />
              <span className="text-sm font-medium">{method.label}</span>
              <span className="text-xs text-muted-foreground">{method.hint}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
        {value === "wallet"
          ? `Thanh toán ${formatPrice(amount)} trực tiếp từ số dư ví.`
          : value === "gateway"
            ? `Thanh toán ${formatPrice(amount)} bằng QR/cổng thanh toán. Trạng thái chỉ hoàn tất sau khi gateway xác nhận.`
            : "Vui lòng chọn một phương thức thanh toán để tiếp tục."}
      </p>
    </section>
  );
}
