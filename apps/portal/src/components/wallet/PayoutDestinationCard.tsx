import { useState } from "react";
import { isAxiosError } from "axios";
import { Landmark, Loader2, Pencil, Plus } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from "@lens/ui";
import { apiErrorMessage } from "@/lib/errors";
import {
  useSaveWalletPayoutDestination,
  useWalletPayoutDestination,
} from "@/queries/useWallet";

export function PayoutDestinationCard() {
  const destination = useWalletPayoutDestination();
  const saveDestination = useSaveWalletPayoutDestination();
  const [open, setOpen] = useState(false);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const configured = destination.data?.is_configured === true;
  const invalid = !bankCode.trim() || !accountNumber.trim() || !accountName.trim();

  const closeDialog = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setBankCode("");
      setAccountNumber("");
      setAccountName("");
    }
  };

  const save = () => {
    if (invalid) return;
    saveDestination.mutate({
      bank_code: bankCode.trim(),
      account_number: accountNumber.trim(),
      account_name: accountName.trim(),
    }, {
      onSuccess: () => {
        toast.success("Đã lưu tài khoản nhận tiền");
        closeDialog(false);
      },
      onError: (error) => {
        const message = isAxiosError(error) && (error.response?.status ?? 0) >= 500
          ? "Hệ thống chưa thể lưu tài khoản lúc này. Vui lòng thử lại sau."
          : apiErrorMessage(error, "Không thể lưu tài khoản ngân hàng");
        toast.error(message);
      },
    });
  };

  return (
    <section id="wallet-payout-destination" className="scroll-mt-24 rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Landmark className="size-4" />
            </span>
            Tài khoản nhận tiền
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản này sẽ được dùng mặc định khi bạn gửi yêu cầu rút tiền.
          </p>
        </div>
        {destination.isSuccess && (
          <Button className="rounded-lg" size="sm" variant={configured ? "outline" : "default"} onClick={() => setOpen(true)}>
            {configured ? <Pencil className="size-4" /> : <Plus className="size-4" />}
            {configured ? "Đổi tài khoản" : "Thêm tài khoản"}
          </Button>
        )}
      </div>

      {destination.isPending ? (
        <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải thông tin tài khoản…
        </div>
      ) : destination.isError ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <p className="text-destructive">Không tải được tài khoản nhận tiền.</p>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void destination.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : configured ? (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background">
            <Landmark className="size-5 text-muted-foreground" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-semibold">{destination.data.account_name}</p>
            <p className="mt-1 text-muted-foreground">
              {destination.data.bank_code} · {destination.data.account_number_masked}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Đã lưu
          </span>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Bạn chưa lưu tài khoản nhận tiền. Thêm tài khoản để sử dụng khi rút số dư ví.
        </div>
      )}

      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{configured ? "Đổi tài khoản nhận tiền" : "Thêm tài khoản nhận tiền"}</DialogTitle>
            <DialogDescription>
              Thông tin được lưu an toàn. Sau khi lưu, trang Ví chỉ hiển thị bốn số cuối của tài khoản.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoComplete="organization"
              value={bankCode}
              onChange={(event) => setBankCode(event.target.value)}
              placeholder="Mã ngân hàng (bank code)"
              aria-label="Mã ngân hàng"
              className="rounded-xl"
            />
            <Input
              autoComplete="off"
              inputMode="numeric"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="Số tài khoản"
              aria-label="Số tài khoản"
              className="rounded-xl"
            />
            <Input
              autoComplete="name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="Tên chủ tài khoản"
              aria-label="Tên chủ tài khoản"
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => closeDialog(false)}>
              Huỷ
            </Button>
            <Button className="rounded-full" disabled={invalid || saveDestination.isPending} onClick={save}>
              {saveDestination.isPending && <Loader2 className="size-4 animate-spin" />}
              Lưu tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
