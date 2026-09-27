import { Link } from "react-router-dom";
import { CalendarDays, Check, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, Button, cn, formatPrice, toast } from "@lens/ui";
import {
  BOOKING_STATUS_META,
  canCancel,
  deliveryProgress,
  remainingAmount,
} from "@/lib/booking";
import { formatCoins } from "@/lib/wallet";
import { useConfirmReceipt } from "@/queries/useBookings";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
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
  const { data: gallery } = useGallery(booking.id);
  // Client can only complete once the package's photo count has been delivered.
  const delivered = gallery?.photos.length ?? 0;
  const progress = deliveryProgress(booking, delivered);

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
          {booking.status === "awaiting_deposit" ? (
            <Button asChild size="sm" className="rounded-full bg-ember text-white hover:bg-ember/90">
              <Link to={`/client/bookings/${booking.id}/deposit`}>
                Đặt cọc {formatPrice(booking.depositAmount)}
              </Link>
            </Button>
          ) : booking.status === "pending" ? (
            <span className="text-xs text-muted-foreground">
              Đã cọc {formatPrice(booking.depositAmount)}
            </span>
          ) : booking.status === "confirmed" ? (
            <Button asChild size="sm" className="rounded-full">
              <Link to={`/client/bookings/${booking.id}/pay`}>
                Thanh toán {formatPrice(remainingAmount(booking))}
              </Link>
            </Button>
          ) : booking.status === "held" ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={confirmReceipt.isPending || !progress.complete}
                onClick={release}
              >
                <Check className="size-4" />
                Đã nhận ảnh
              </Button>
              {delivered === 0 ? (
                <span className="text-xs text-muted-foreground">
                  Chờ nhiếp ảnh gia giao ảnh
                </span>
              ) : (
                <Link
                  to={`/client/bookings/${booking.id}/gallery`}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {progress.complete
                    ? "Xem ảnh"
                    : `Đã giao ${delivered}/${progress.required} ảnh`}
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
          {canCancel(booking) && (
            <CancelBookingDialog
              booking={booking}
              trigger={
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                  Huỷ lịch
                </button>
              }
            />
          )}
        </div>
      </div>

    </div>
  );
}
