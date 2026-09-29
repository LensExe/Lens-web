import { Link } from "react-router-dom";
import { CalendarDays, Camera, Check, Clock, Images, MapPin, Phone, ShieldCheck, Wallet, X } from "lucide-react";
import { Avatar, AvatarFallback, Button, TONE_CHIP, cn, formatPrice, toast } from "@lens/ui";
import {
  BOOKING_STATUS_META,
  commissionAmount,
  deliveryProgress,
  photographerPayout,
} from "@/lib/booking";
import { useUpdateBookingStatus } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import { MessageButton } from "@/components/profile/MessageButton";
import { addMinutesToTime } from "@/lib/schedule";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const maskPhone = (phone?: string) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? `${digits.slice(0, 4)} ••• ${digits.slice(-3)}` : phone;
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
  const status = BOOKING_STATUS_META[booking.status];
  const { mutate, isPending } = useUpdateBookingStatus();
  const { data: gallery } = useGallery(booking.id);
  const isActionable = booking.status === "pending";
  const progress = deliveryProgress(booking, gallery?.photos.length ?? 0);

  const decide = (next: "confirmed" | "cancelled") =>
    mutate(
      { id: booking.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === "confirmed"
              ? `Đã xác nhận lịch chụp với ${booking.clientName}`
              : `Đã từ chối và hoàn cọc cho ${booking.clientName}`
          ),
        onError: () => toast.error("Không thể cập nhật yêu cầu, vui lòng thử lại"),
      }
    );

  if (variant === "bookingGrid") {
    const phone = maskPhone(booking.contactPhone);
    const timeRange = bookingTimeRange(booking);

    return (
      <article
        className={cn(
          "flex min-w-0 flex-col rounded-2xl border bg-card p-3.5 shadow-xs transition-colors sm:p-4",
          isActionable
            ? "border-orange-200/80 hover:border-orange-300"
            : "border-border hover:border-border/60 hover:bg-muted/20"
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
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}>
                {status.label}
              </span>
            </div>
            {phone && (
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Phone className="size-3" /> {phone}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums">{formatPrice(booking.price)}</p>
            {isActionable ? (
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <ShieldCheck className="size-3" />
                Đã cọc {formatPrice(booking.depositAmount)}
              </p>
            ) : booking.status === "held" || booking.status === "released" ? (
              <p className="mt-1 text-[10px] text-muted-foreground">
                Thực nhận {formatPrice(photographerPayout(booking.price))}
              </p>
            ) : null}
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
          {booking.note && (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-border/70 bg-card/70 px-2 py-1.5 text-muted-foreground">
              <span className="shrink-0">Ghi chú:</span>
              <span className="line-clamp-1">{booking.note}</span>
            </p>
          )}
        </div>

        {isActionable && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <MessageButton
              participant={{ id: booking.clientId, name: booking.clientName, role: "client" }}
              label="Nhắn tin"
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2 text-xs text-muted-foreground"
            />
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

        {booking.status === "confirmed" && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
            <MessageButton
              participant={{ id: booking.clientId, name: booking.clientName, role: "client" }}
              label="Nhắn tin"
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2 text-xs text-muted-foreground"
            />
          </div>
        )}

        {booking.status === "held" && (
          <div className="mt-3 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Sàn đang giữ tiền · nhận {formatPrice(photographerPayout(booking.price))} sau khi giao ảnh
              </p>
              <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", TONE_CHIP[progress.complete ? "emerald" : "amber"])}>
                {progress.complete
                  ? `Đã giao đủ ${progress.required} ảnh`
                  : `Cần giao thêm ${progress.missing} ảnh (${progress.delivered}/${progress.required})`}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-lg">
                <Link to={`/dashboard/bookings/${booking.id}/gallery`}>
                  <Images className="size-3.5" /> Giao ảnh
                </Link>
              </Button>
            </div>
          </div>
        )}

        {booking.status === "released" && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
            <p className="text-xs text-muted-foreground">
              Đã nhận {formatPrice(photographerPayout(booking.price))} · phí sàn {formatPrice(commissionAmount(booking.price))}
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
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
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
          {isActionable && (
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <ShieldCheck className="size-3" />
              Khách đã cọc {formatPrice(booking.depositAmount)}
            </p>
          )}
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

      {booking.status === "confirmed" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Bạn đã xác nhận. Đang chờ khách thanh toán phần còn lại.
          </p>
        </div>
      )}

      {/* Escrow: money held by the platform, released after delivery. */}
      {booking.status === "held" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span>
                Tiền đang được sàn giữ. Bạn sẽ nhận{" "}
                <span className="font-medium text-foreground">
                  {formatPrice(photographerPayout(booking.price))}
                </span>{" "}
                sau khi khách xác nhận đã nhận ảnh.
              </span>
            </p>
            <span
              className={cn(
                "ml-6 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                TONE_CHIP[progress.complete ? "emerald" : "amber"]
              )}
            >
              {progress.complete
                ? `Đã giao đủ ${progress.required} ảnh`
                : `Cần giao thêm ${progress.missing} ảnh (${progress.delivered}/${progress.required})`}
            </span>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to={`/dashboard/bookings/${booking.id}/gallery`}>
                <Images className="size-4" />
                Giao ảnh
              </Link>
            </Button>
          </div>
        </div>
      )}

      {booking.status === "released" && (
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Đã nhận{" "}
            <span className="font-medium text-foreground">
              {formatPrice(photographerPayout(booking.price))}
            </span>{" "}
            (đã trừ phí sàn {formatPrice(commissionAmount(booking.price))}).
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
