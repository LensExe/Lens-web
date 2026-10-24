import { useState } from "react";
import { isAxiosError } from "axios";
import { BanknoteArrowDown, Landmark, Loader2 } from "lucide-react";
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
import { apiErrorMessage } from "@/lib/errors";
import { useWalletPayoutDestination, useWithdraw } from "@/queries/useWallet";

/** "Rút tiền" dialog: submit an amount to the account saved on the wallet page. */
export function WithdrawDialog({
  balance,
  label = "Rút tiền",
  className,
}: {
  balance: number;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const destination = useWalletPayoutDestination(open);
  const withdraw = useWithdraw();

  const value = Number(amount.replace(/\D/g, ""));
  const configured = destination.data?.is_configured === true;
  const invalid = !value || value > balance || !reason.trim();

  const closeDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setAmount("");
      setReason("");
    }
  };

  const submit = () => {
    if (invalid || !configured) return;
    withdraw.mutate({
      amount: value,
      reason: reason.trim(),
      idempotency_key: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }, {
      onSuccess: () => {
        toast.success(`Đã gửi yêu cầu rút ${formatPrice(value)}`);
        closeDialog(false);
      },
      onError: (error) => {
        const message = isAxiosError(error) && (error.response?.status ?? 0) >= 500
          ? "Hệ thống rút tiền đang gặp sự cố. Vui lòng thử lại sau."
          : apiErrorMessage(error, "Không thể rút tiền, vui lòng thử lại");
        toast.error(message);
      },
    });
  };

  const goToPayoutSettings = () => {
    closeDialog(false);
    document.getElementById("wallet-payout-destination")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <Button className={className ?? "rounded-full"} variant="outline" size="sm" disabled={balance <= 0} onClick={() => setOpen(true)}>
        <BanknoteArrowDown className="size-4" />
        {label}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rút tiền về ngân hàng</DialogTitle>
          <DialogDescription>
            Số dư khả dụng: {formatPrice(balance)}.
            {configured ? " Tiền sẽ được chuyển đến tài khoản đã lưu trên trang Ví." : " Cần có tài khoản nhận tiền đã lưu trước khi rút."}
          </DialogDescription>
        </DialogHeader>

        {destination.isPending && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Đang tải tài khoản nhận tiền…
          </div>
        )}

        {destination.isError && (
          <div className="space-y-3 py-2 text-sm">
            <p className="text-destructive">Không tải được tài khoản nhận tiền. Hãy thử tải lại.</p>
            <Button variant="outline" className="rounded-full" onClick={() => void destination.refetch()}>
              Thử lại
            </Button>
          </div>
        )}

        {destination.isSuccess && !configured && (
          <div className="space-y-3 rounded-xl border border-dashed border-border p-4 text-sm">
            <p className="text-muted-foreground">Bạn chưa có tài khoản nhận tiền. Hãy thêm tài khoản ở mục riêng trên trang Ví.</p>
            <Button variant="outline" className="rounded-full" onClick={goToPayoutSettings}>
              Thêm tài khoản nhận tiền
            </Button>
          </div>
        )}

        {destination.isSuccess && configured && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Landmark className="size-5" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold">{destination.data.account_name}</p>
                <p className="mt-1 text-muted-foreground">
                  {destination.data.bank_code} · {destination.data.account_number_masked}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                inputMode="numeric"
                placeholder="Số tiền (VND), ví dụ: 500000"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-11 rounded-xl"
              />
              <Input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Lý do rút tiền"
                className="rounded-xl"
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
                  Yêu cầu rút {formatPrice(value)}
                  {value > balance && <span className="text-destructive"> — vượt số dư</span>}
                </p>
              )}
            </div>
          </div>
        )}

        {destination.isSuccess && configured && (
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => closeDialog(false)}>
              Huỷ
            </Button>
            <Button className="rounded-full" disabled={invalid || withdraw.isPending} onClick={submit}>
              {withdraw.isPending && <Loader2 className="size-4 animate-spin" />}
              Xác nhận rút
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
