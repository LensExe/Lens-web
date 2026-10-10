import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
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
import { bookingApi } from "@/services/backend";
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
  const preview = useQuery({
    queryKey: ["bookings", booking.id, "cancellation-preview"],
    queryFn: () => bookingApi.getCancellationPreview(booking.id),
    enabled: open,
  });

  const submit = () =>
    cancel.mutate(booking.id, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Đã huỷ lịch đặt. Nếu lịch có giao dịch, yêu cầu hoàn tiền sẽ được xử lý theo backend.");
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

        <p className={cn("flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300")}>
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {preview.data ? (
              <>
                Số tiền đã thanh toán còn có thể yêu cầu hoàn: <b>{formatPrice(preview.data.refundable_amount_vnd)}</b>.
                Yêu cầu hoàn tiền vẫn cần quản trị viên xử lý.
              </>
            ) : preview.isError ? (
              "Chưa tải được số tiền hoàn dự kiến. Yêu cầu hoàn tiền vẫn sẽ được backend tổng hợp và gửi quản trị viên xử lý."
            ) : (
              "Đang tính số tiền đã thanh toán còn có thể yêu cầu hoàn…"
            )}
          </span>
        </p>

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
