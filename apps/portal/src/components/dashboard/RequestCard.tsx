import { CalendarDays, Check, MapPin, X } from "lucide-react";
import { Avatar, AvatarFallback, Button, cn, formatPrice, toast } from "@lens/ui";
import { BOOKING_STATUS_META } from "@/lib/booking";
import { useUpdateBookingStatus } from "@/queries/useDashboard";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function RequestCard({ booking }: { booking: Booking }) {
  const status = BOOKING_STATUS_META[booking.status];
  const { mutate, isPending } = useUpdateBookingStatus();
  const isActionable = booking.status === "pending";

  const decide = (next: "confirmed" | "cancelled") =>
    mutate(
      { id: booking.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === "confirmed"
              ? `Đã xác nhận lịch chụp với ${booking.clientName}`
              : `Đã từ chối yêu cầu của ${booking.clientName}`
          ),
        onError: () => toast.error("Không thể cập nhật yêu cầu, vui lòng thử lại"),
      }
    );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-4">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback>{initialsOf(booking.clientName)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{booking.clientName}</p>
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span>{booking.style}</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {formatDate(booking.date)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {booking.location}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatPrice(booking.price)}</p>
        </div>
      </div>

      {isActionable && (
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            className="rounded-full"
            disabled={isPending}
            onClick={() => decide("cancelled")}
          >
            <X className="size-4" />
            Từ chối
          </Button>
          <Button
            className="rounded-full"
            disabled={isPending}
            onClick={() => decide("confirmed")}
          >
            <Check className="size-4" />
            Xác nhận
          </Button>
        </div>
      )}
    </div>
  );
}
