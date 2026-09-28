import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, Clock3, MapPin } from "lucide-react";
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
  name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("");

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split("-");
  return day + "/" + month + "/" + year;
};

function BookingAction({ booking }: { booking: Booking }) {
  const confirmReceipt = useConfirmReceipt();
  const { data: gallery } = useGallery(booking.id);
  const delivered = gallery?.photos.length ?? 0;
  const progress = deliveryProgress(booking, delivered);

  const release = () =>
    confirmReceipt.mutate(booking.id, {
      onSuccess: (updated) => {
        const earned = updated.coinsEarned ?? 0;
        toast.success(
          earned > 0
            ? "Đã xác nhận · nhận +" + formatCoins(earned) + " hoàn lại"
            : "Đã xác nhận nhận ảnh từ " + booking.photographerName,
        );
      },
      onError: () => toast.error("Không thể xác nhận, vui lòng thử lại"),
    });

  if (booking.status === "awaiting_deposit") {
    return (
      <Button
        asChild
        size="xs"
        className="h-6 rounded-full bg-ember px-2.5 text-[10px] text-white hover:bg-ember/90"
      >
        <Link to={"/client/bookings/" + booking.id + "/deposit"}>
          Đặt cọc {formatPrice(booking.depositAmount)}
        </Link>
      </Button>
    );
  }

  if (booking.status === "pending") {
    return <span className="text-[10px] text-muted-foreground">Đã cọc {formatPrice(booking.depositAmount)}</span>;
  }

  if (booking.status === "confirmed") {
    return (
      <Button
        asChild
        size="xs"
        className="h-6 rounded-full bg-ember px-2.5 text-[10px] text-white hover:bg-ember/90"
      >
        <Link to={"/client/bookings/" + booking.id + "/pay"}>
          Thanh toán {formatPrice(remainingAmount(booking))}
        </Link>
      </Button>
    );
  }

  if (booking.status === "held") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          size="xs"
          variant="outline"
          className="h-6 rounded-full px-2.5 text-[10px]"
          disabled={confirmReceipt.isPending || !progress.complete}
          onClick={release}
        >
          <Check className="size-3" />
          Đã nhận ảnh
        </Button>
        {delivered === 0 ? (
          <span className="text-[10px] text-muted-foreground">Chờ giao ảnh</span>
        ) : (
          <Link
            to={"/client/bookings/" + booking.id + "/gallery"}
            className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {progress.complete ? "Xem ảnh" : "Đã giao " + delivered + "/" + progress.required + " ảnh"}
          </Link>
        )}
      </div>
    );
  }

  if (booking.status === "released") {
    return (
      <div className="flex flex-col items-end gap-1">
        {booking.coinsEarned ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            +{formatCoins(booking.coinsEarned)} Lens Xu
          </span>
        ) : null}
        <Link
          to={"/client/bookings/" + booking.id + "/gallery"}
          className="text-[10px] font-medium text-ember transition-colors hover:text-ember/80"
        >
          Xem ảnh
        </Link>
      </div>
    );
  }

  return (
    <Link
      to={"/photographers/" + booking.photographerId}
      className="text-[10px] text-muted-foreground transition-colors hover:text-foreground"
    >
      Xem hồ sơ
    </Link>
  );
}

export function BookingCard({ booking }: { booking: Booking }) {
  const status = BOOKING_STATUS_META[booking.status];
  const needsPayment = booking.status === "awaiting_deposit" || booking.status === "confirmed";

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-xs transition-all hover:-translate-y-px hover:shadow-sm sm:p-5",
        booking.status === "confirmed"
          ? "border-ember ring-1 ring-ember/15"
          : needsPayment
            ? "border-ember/35"
            : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0 sm:size-11">
          <AvatarFallback className="bg-muted text-xs font-semibold">
            {initialsOf(booking.photographerName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Link
              to={"/client/bookings/" + booking.id}
              className="truncate text-sm font-semibold transition-colors hover:text-ember"
            >
              {booking.photographerName}
            </Link>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", status.className)}>
              {status.label}
            </span>
          </div>

          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-foreground/75">{booking.style}</span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3 shrink-0" />
              {formatDate(booking.date)}
            </span>
            {booking.timeSlot && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3 shrink-0" />
                {booking.timeSlot}
              </span>
            )}
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="max-w-[14rem] truncate">{booking.location}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">{formatPrice(booking.price)}</p>
          {booking.status === "confirmed" && (
            <p className="mt-0.5 text-[10px] font-medium text-ember">Còn lại {formatPrice(remainingAmount(booking))}</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 p-3">
        <div className="flex items-start gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground shadow-xs">
            <CalendarDays className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {booking.packageSnapshot?.name ?? `Gói chụp ${booking.style}`}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {booking.packageSnapshot
                ? `${booking.packageSnapshot.durationHours} giờ · ${booking.packageSnapshot.photoCount} ảnh · giao trong ${booking.packageSnapshot.deliveryDays} ngày`
                : "Thông tin gói chụp và tiến độ sẽ được cập nhật tại đây"}
            </p>
          </div>
        </div>
        {booking.note && (
          <p className="mt-2 truncate border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
            Ghi chú: {booking.note}
          </p>
        )}
        {booking.collaborators && booking.collaborators.length > 0 && (
          <p className="mt-2 truncate border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
            Nhóm {booking.collaborators.length + 1} thợ ·{" "}
            {booking.collaborators.map((collaborator) => collaborator.photographerName).join(", ")}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        <Link
          to={"/client/bookings/" + booking.id}
          className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Xem chi tiết
          <ArrowRight className="size-3" />
        </Link>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <BookingAction booking={booking} />
          {canCancel(booking) && (
            <CancelBookingDialog
              booking={booking}
              trigger={
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground transition-colors hover:text-destructive"
                >
                  Huỷ lịch
                </button>
              }
            />
          )}
        </div>
      </div>
    </article>
  );
}
