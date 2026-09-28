import { useState } from "react";
import { BanknoteArrowDown, Loader2 } from "lucide-react";
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

/** "Rút tiền" button + dialog: cash the wallet balance out to the bank. */
export function WithdrawDialog({
  balance,
  label = "Rút tiền",
  className,
}: {
  balance: number;
  label?: string;
  className?: string;
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
    <Dialog open={open} onOpenChange={setOpen}>
      <Button className={className ?? "rounded-full"} variant="outline" size="sm" disabled={balance <= 0} onClick={() => setOpen(true)}>
        <BanknoteArrowDown className="size-4" />
        {label}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rút tiền về ngân hàng</DialogTitle>
          <DialogDescription>Số dư khả dụng: {formatPrice(balance)}. Nhập số tiền muốn rút.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            inputMode="numeric"
            placeholder="Ví dụ: 500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-xl"
          />
          <div className="flex flex-wrap gap-1.5">
            {[0.25, 0.5, 1].map((share) => (
              <button
                key={share}
                type="button"
                onClick={() => setAmount(String(Math.floor((balance * share) / 1_000) * 1_000))}
                className="focus-ring rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
              >
                {share === 1 ? "Rút hết" : `${share * 100}%`}
              </button>
            ))}
          </div>
          {value > 0 && (
            <p className="text-sm text-muted-foreground">
              Rút {formatPrice(value)}
              {value > balance && <span className="text-destructive"> — vượt số dư</span>}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
          <Button className="rounded-full" disabled={invalid || withdraw.isPending} onClick={submit}>
            {withdraw.isPending && <Loader2 className="size-4 animate-spin" />}
            Xác nhận rút
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
