import { useState, type ReactNode } from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
  cn,
  formatPrice,
  toast,
} from "@lens/ui";
import { useCancelBooking } from "@/queries/useBookings";
import { FREE_CANCEL_DAYS, cancelTerms, freeCancelDeadline } from "@/lib/booking";
import { formatCoins } from "@/lib/wallet";
import type { Booking } from "@/types";

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/**
 * Cancel a booking with the policy spelled out: what comes back to the wallet,
 * what (if anything) is forfeited, and until when cancelling is free.
 */
export function CancelBookingDialog({
  booking,
  trigger,
}: {
  booking: Booking;
  /** The element that opens the dialog (a button / link). */
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const cancel = useCancelBooking();
  const terms = cancelTerms(booking);
  const accepted = booking.status === "confirmed" || booking.status === "held";
  const deadline = freeCancelDeadline(booking.date);

  const submit = () =>
    cancel.mutate(booking.id, {
      onSuccess: () => {
        setOpen(false);
        toast.success(
          terms.refund > 0
            ? `Đã huỷ lịch · hoàn ${formatPrice(terms.refund)} vào ví`
            : "Đã huỷ lịch đặt"
        );
      },
      onError: () => toast.error("Không thể huỷ lịch, vui lòng thử lại"),
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Huỷ lịch chụp với {booking.photographerName}?</DialogTitle>
          <DialogDescription>
            Buổi chụp ngày {formatDate(booking.date)}. Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        {/* Policy line */}
        <p
          className={cn(
            "flex items-start gap-2 rounded-2xl px-4 py-3 text-sm",
            terms.free
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
          )}
        >
          {terms.free ? (
            <Info className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          )}
          <span>
            {booking.status === "awaiting_deposit"
              ? "Bạn chưa đặt cọc nên huỷ không mất phí."
              : !accepted
                ? "Nhiếp ảnh gia chưa xác nhận — bạn được hoàn đủ tiền cọc."
                : terms.free
                  ? `Huỷ miễn phí đến hết ngày ${formatDate(deadline)} (${FREE_CANCEL_DAYS} ngày trước buổi chụp).`
                  : `Đã quá hạn huỷ miễn phí (${formatDate(deadline)}). Tiền cọc sẽ được chuyển cho nhiếp ảnh gia.`}
          </span>
        </p>

        {(terms.refund > 0 || terms.forfeit > 0 || terms.coinsBack > 0) && (
          <dl className="space-y-2 text-sm">
            {terms.refund > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Hoàn vào ví</dt>
                <dd className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                  +{formatPrice(terms.refund)}
                </dd>
              </div>
            )}
            {terms.coinsBack > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lens Xu hoàn lại</dt>
                <dd className="font-medium tabular-nums">+{formatCoins(terms.coinsBack)}</dd>
              </div>
            )}
            {terms.forfeit > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Mất tiền cọc</dt>
                <dd className="font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                  −{formatPrice(terms.forfeit)}
                </dd>
              </div>
            )}
          </dl>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
            Giữ lịch
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={cancel.isPending}
            onClick={submit}
          >
            {cancel.isPending && <Spinner />}
            Xác nhận huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
