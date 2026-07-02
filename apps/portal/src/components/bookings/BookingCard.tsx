import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Loader2, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, Button, cn, formatPrice, toast } from "@lens/ui";
import { BOOKING_STATUS_META } from "@/lib/booking";
import { formatCoins } from "@/lib/wallet";
import { useCancelBooking, useConfirmReceipt } from "@/queries/useBookings";
import { useGallery } from "@/queries/useStorage";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function BookingCard({ booking }: { booking: Booking }) {
  const status = BOOKING_STATUS_META[booking.status];
  const confirmReceipt = useConfirmReceipt();
  const cancelBooking = useCancelBooking();
  const { data: gallery } = useGallery(booking.id);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  // Client can only complete once the photographer has delivered photos.
  const hasPhotos = !!gallery?.photos.length;

  const release = () =>
    confirmReceipt.mutate(booking.id, {
      onSuccess: (updated) => {
        const earned = updated.coinsEarned ?? 0;
        toast.success(
          earned > 0
            ? `Đã xác nhận · nhận +${formatCoins(earned)} hoàn lại`
            : `Đã xác nhận nhận ảnh từ ${booking.photographerName}`
        );
      },
      onError: () => toast.error("Không thể xác nhận, vui lòng thử lại"),
    });

  const cancel = () =>
    cancelBooking.mutate(booking.id, {
      onSuccess: () =>
        toast.success(`Đã huỷ và hoàn lại ${formatPrice(booking.price)}`),
      onError: () => toast.error("Không thể huỷ lịch, vui lòng thử lại"),
    });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-4">
        <Avatar className="size-12 shrink-0">
          <AvatarFallback>{initialsOf(booking.photographerName)}</AvatarFallback>
        </Avatar>

        <Link to={`/client/bookings/${booking.id}`} className="group/detail min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold group-hover/detail:underline">
              {booking.photographerName}
            </p>
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
          {booking.collaborators && booking.collaborators.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              Nhóm {booking.collaborators.length + 1} thợ ·{" "}
              {booking.collaborators.map((c) => c.photographerName).join(", ")}
            </p>
          )}
        </Link>

        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
          <p className="font-semibold">{formatPrice(booking.price)}</p>
          {booking.status === "confirmed" ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to={`/client/bookings/${booking.id}/pay`}>Thanh toán</Link>
            </Button>
          ) : booking.status === "held" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={confirmReceipt.isPending || !hasPhotos}
                onClick={release}
              >
                <Check className="size-4" />
                Đã nhận ảnh
              </Button>
              {!hasPhotos && (
                <span className="text-xs text-muted-foreground">
                  Chờ nhiếp ảnh gia giao ảnh
                </span>
              )}
              <button
                type="button"
                onClick={() => setConfirmingCancel(true)}
                className="text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                Huỷ & hoàn tiền
              </button>
              {hasPhotos && (
                <Link
                  to={`/client/bookings/${booking.id}/gallery`}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Xem ảnh
                </Link>
              )}
            </>
          ) : booking.status === "released" ? (
            <>
              {booking.coinsEarned ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  +{formatCoins(booking.coinsEarned)}
                </span>
              ) : null}
              <Link
                to={`/client/bookings/${booking.id}/gallery`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Xem ảnh
              </Link>
            </>
          ) : (
            <Link
              to={`/photographers/${booking.photographerId}`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Xem hồ sơ
            </Link>
          )}
        </div>
      </div>

      {/* Inline confirm — escrow refunds the full amount on cancellation. */}
      {confirmingCancel && booking.status === "held" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Huỷ buổi chụp và hoàn lại{" "}
            <span className="font-medium text-foreground">
              {formatPrice(booking.price)}
            </span>{" "}
            cho bạn?
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={cancelBooking.isPending}
              onClick={() => setConfirmingCancel(false)}
            >
              Giữ lịch
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="rounded-full"
              disabled={cancelBooking.isPending}
              onClick={cancel}
            >
              {cancelBooking.isPending && <Loader2 className="size-4 animate-spin" />}
              Huỷ & hoàn tiền
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
