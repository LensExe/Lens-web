import { useState } from "react";
import { BanknoteArrowDown, Loader2, WalletMinimal } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  formatPrice,
  toast,
} from "@lens/ui";
import { useWithdraw } from "@/queries/useWallet";

export function BalanceCard({
  balance,
  canWithdraw,
}: {
  balance: number;
  /** Photographers can cash out earnings; clients only see the balance. */
  canWithdraw: boolean;
}) {
  const withdraw = useWithdraw();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const value = Number(amount.replace(/\D/g, ""));
  const invalid = !value || value > balance;

  const submit = () => {
    if (invalid) return;
    withdraw.mutate(value, {
      onSuccess: () => {
        toast.success(`Đã gửi yêu cầu rút ${formatPrice(value)}`);
        setOpen(false);
        setAmount("");
      },
      onError: () => toast.error("Không thể rút tiền, vui lòng thử lại"),
    });
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <WalletMinimal className="size-4" />
        Số dư ví
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
        {formatPrice(balance)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {canWithdraw
          ? "Tiền được giải ngân sau khi khách xác nhận đã nhận đủ ảnh."
          : "Tiền hoàn lại từ các buổi chụp đã huỷ sẽ hiển thị ở đây."}
      </p>

      {canWithdraw && (
        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className="mt-5 rounded-full"
            disabled={balance <= 0}
            onClick={() => setOpen(true)}
          >
            <BanknoteArrowDown className="size-4" />
            Rút tiền
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rút tiền về ngân hàng</DialogTitle>
              <DialogDescription>
                Số dư khả dụng: {formatPrice(balance)}. Nhập số tiền muốn rút.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                inputMode="numeric"
                placeholder="Ví dụ: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {value > 0 && (
                <p className="text-sm text-muted-foreground">
                  Rút {formatPrice(value)}
                  {value > balance && (
                    <span className="text-destructive"> — vượt số dư</span>
                  )}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                className="rounded-full"
                disabled={invalid || withdraw.isPending}
                onClick={submit}
              >
                {withdraw.isPending && <Loader2 className="size-4 animate-spin" />}
                Xác nhận rút
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
