import { Link } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  Check,
  Clock,
  Images,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, Button, TONE_CHIP, cn, formatPrice, toast } from "@lens/ui";
import { bookingStatusMeta, deliveryProgress } from "@/lib/booking";
import { useCompleteShoot, useUpdateBookingStatus } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import { addMinutesToTime } from "@/lib/schedule";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const bookingTimeRange = (booking: Booking) => {
  if (!booking.timeSlot) return null;
  const durationMinutes = Math.round((booking.packageSnapshot?.durationHours ?? 2) * 60);
  return `${booking.timeSlot}–${addMinutesToTime(booking.timeSlot, durationMinutes)}`;
};

export function RequestCard({
  booking,
  variant = "default",
}: {
  booking: Booking;
  variant?: "default" | "bookingGrid";
}) {
  const status = bookingStatusMeta(booking);
  const { mutate, isPending } = useUpdateBookingStatus();
  const completeShoot = useCompleteShoot();
  const { data: gallery } = useGallery(booking.id);
  const isActionable = booking.status === "pending";
  const progress = deliveryProgress(booking, gallery?.photos.length ?? 0);
  const backendStatus = booking.backendStatus;

  const decide = (next: "confirmed" | "cancelled") =>
    mutate(
      { id: booking.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === "confirmed"
              ? `Đã chấp nhận yêu cầu đặt lịch của ${booking.clientName}`
              : `Đã từ chối yêu cầu đặt lịch của ${booking.clientName}`,
          ),
        onError: () => toast.error("Không thể cập nhật yêu cầu, vui lòng thử lại"),
      },
    );

  const startShoot = () =>
    mutate(
      { id: booking.id, status: "held" },
      {
        onSuccess: () => toast.success("Đã bắt đầu buổi chụp"),
        onError: () => toast.error("Không thể bắt đầu buổi chụp, vui lòng thử lại"),
      },
    );
  const finishShoot = () =>
    completeShoot.mutate(booking.id, {
      onSuccess: () => toast.success("Đã đánh dấu buổi chụp hoàn tất"),
      onError: () => toast.error("Không thể hoàn tất buổi chụp, vui lòng thử lại"),
    });

  if (variant === "bookingGrid") {
    const timeRange = bookingTimeRange(booking);

    return (
      <article
        className={cn(
          "flex min-w-0 flex-col rounded-2xl border bg-card p-3.5 shadow-xs transition-colors sm:p-4",
          isActionable
            ? "border-orange-200/80 hover:border-orange-300"
            : "border-border hover:border-border/60 hover:bg-muted/20",
        )}
      >
        <div className="flex min-w-0 items-start gap-3">
          <Avatar className="size-10 shrink-0">
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {initialsOf(booking.clientName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                to={`/dashboard/bookings/${booking.id}`}
                className="truncate text-sm font-semibold hover:underline"
              >
                {booking.clientName}
              </Link>
              <span
                className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}
              >
                {status.label}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <p className="text-sm font-bold tabular-nums">{formatPrice(booking.price)}</p>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Link to={`/dashboard/bookings/${booking.id}`}>
                <RefreshCw className="size-3.5" />
                Cập nhật trạng thái
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs dark:bg-muted/30">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
            <p className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
              <Camera className="size-3.5 shrink-0 text-orange-600 dark:text-orange-400" />
              <span className="truncate">
                {booking.style}
                {booking.packageSnapshot?.name ? ` · ${booking.packageSnapshot.name}` : ""}
              </span>
            </p>
            <p className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatDate(booking.date)}
              {timeRange ? ` · ${timeRange}` : ""}
            </p>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-1">{booking.location}</span>
          </p>
        </div>

        {isActionable && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Đã thanh toán cọc · chờ bạn xác nhận</p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-lg"
                disabled={isPending}
                onClick={() => decide("cancelled")}
              >
                <X className="size-3.5" />
                Từ chối
              </Button>
              <Button
                size="sm"
                className="rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                disabled={isPending}
                onClick={() => decide("confirmed")}
              >
                <Check className="size-3.5" />
                Xác nhận
              </Button>
            </div>
          </div>
        )}

        {booking.status === "awaiting_deposit" && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Clock className="mt-0.5 size-3.5 shrink-0" /> Đang chờ khách thanh toán cọc · chưa
              thể xác nhận
            </p>
          </div>
        )}

        {booking.status === "confirmed" && (
          <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" /> Đã nhận tiền cọc · có thể bắt đầu
              buổi chụp
            </p>
            <Button size="sm" className="rounded-lg" disabled={isPending} onClick={startShoot}>
              Bắt đầu buổi chụp
            </Button>
          </div>
        )}

        {booking.status === "held" && (
          <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {backendStatus === "accepted" && (
                <p className="text-xs text-muted-foreground">
                  Đã thanh toán đủ · sẵn sàng bắt đầu buổi chụp
                </p>
              )}
              {backendStatus === "in_progress" && (
                <p className="text-xs text-muted-foreground">Buổi chụp đang diễn ra</p>
              )}
              {backendStatus === "shot" && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Buổi chụp hoàn tất · tải ảnh lên để giao cho khách
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                      TONE_CHIP[progress.complete ? "emerald" : "amber"],
                    )}
                  >
                    {progress.complete
                      ? `Đã tải đủ ${progress.required} ảnh`
                      : `Cần tải thêm ${progress.missing} ảnh (${progress.delivered}/${progress.required})`}
                  </span>
                </>
              )}
            </div>
            {backendStatus === "accepted" && (
              <Button size="sm" className="rounded-lg" disabled={isPending} onClick={startShoot}>
                Bắt đầu buổi chụp
              </Button>
            )}
            {backendStatus === "in_progress" && (
              <Button
                size="sm"
                className="rounded-lg"
                disabled={completeShoot.isPending}
                onClick={finishShoot}
              >
                Đánh dấu đã chụp
              </Button>
            )}
            {backendStatus === "shot" && (
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link to={`/dashboard/bookings/${booking.id}/gallery`}>
                  <Images className="size-3.5" /> Giao ảnh
                </Link>
              </Button>
            )}
          </div>
        )}

        {booking.status === "released" && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
            <p className="text-xs text-muted-foreground">
              Booking đã hoàn tất · số tiền thực nhận xem trong Ví Lens
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link to={`/dashboard/bookings/${booking.id}/gallery`}>
                <Images className="size-3.5" /> Xem ảnh
              </Link>
            </Button>
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-xs transition-colors hover:bg-muted/30 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
          <Avatar className="size-11 shrink-0 sm:size-12">
            <AvatarFallback>{initialsOf(booking.clientName)}</AvatarFallback>
          </Avatar>

          <Link to={`/dashboard/bookings/${booking.id}`} className="group/detail min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold group-hover/detail:underline">
                {booking.clientName}
              </p>
              <span
                className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}
              >
                {status.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{booking.style}</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatDate(booking.date)}
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{booking.location}</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:block sm:shrink-0 sm:border-0 sm:pt-0 sm:text-right">
          <p className="font-semibold tabular-nums">{formatPrice(booking.price)}</p>
          {isActionable && <p className="text-xs text-muted-foreground">Yêu cầu mới</p>}
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
          <Button className="rounded-full" disabled={isPending} onClick={() => decide("confirmed")}>
            <Check className="size-4" />
            Xác nhận
          </Button>
        </div>
      )}

      {booking.status === "awaiting_deposit" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Đang chờ khách thanh toán tiền cọc trước khi bạn xác nhận booking.
          </p>
        </div>
      )}

      {booking.status === "confirmed" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" /> Đã nhận tiền cọc · có thể bắt đầu
            buổi chụp
          </p>
          <Button
            size="sm"
            className="shrink-0 rounded-full"
            disabled={isPending}
            onClick={startShoot}
          >
            Bắt đầu buổi chụp
          </Button>
        </div>
      )}

      {booking.status === "held" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {backendStatus === "accepted" && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                Đã thanh toán đủ. Có thể bắt đầu buổi chụp.
              </p>
            )}
            {backendStatus === "in_progress" && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="mt-0.5 size-4 shrink-0" />
                Buổi chụp đang diễn ra.
              </p>
            )}
            {backendStatus === "shot" && (
              <>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Images className="mt-0.5 size-4 shrink-0" />
                  Buổi chụp hoàn tất. Tải ảnh lên và giao gallery cho khách.
                </p>
                <span
                  className={cn(
                    "ml-6 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    TONE_CHIP[progress.complete ? "emerald" : "amber"],
                  )}
                >
                  {progress.complete
                    ? `Đã tải đủ ${progress.required} ảnh`
                    : `Cần tải thêm ${progress.missing} ảnh (${progress.delivered}/${progress.required})`}
                </span>
              </>
            )}
          </div>
          {backendStatus === "accepted" && (
            <Button
              size="sm"
              className="shrink-0 rounded-full"
              disabled={isPending}
              onClick={startShoot}
            >
              Bắt đầu buổi chụp
            </Button>
          )}
          {backendStatus === "in_progress" && (
            <Button
              size="sm"
              className="shrink-0 rounded-full"
              disabled={completeShoot.isPending}
              onClick={finishShoot}
            >
              Đánh dấu đã chụp
            </Button>
          )}
          {backendStatus === "shot" && (
            <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
              <Link to={`/dashboard/bookings/${booking.id}/gallery`}>
                <Images className="size-4" />
                Giao ảnh
              </Link>
            </Button>
          )}
        </div>
      )}

      {booking.status === "released" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Booking đã hoàn tất. Số dư và giao dịch thực nhận xem trong Ví Lens.
          </p>
          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-full">
            <Link to={`/dashboard/bookings/${booking.id}/gallery`}>
              <Images className="size-4" />
              Xem ảnh
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
