import { Link } from "react-router-dom";
import { CalendarDays, Check, Clock, Images, MapPin, ShieldCheck, Wallet, X } from "lucide-react";
import { Avatar, AvatarFallback, Button, TONE_CHIP, cn, formatPrice, toast } from "@lens/ui";
import {
  BOOKING_STATUS_META,
  commissionAmount,
  deliveryProgress,
  photographerPayout,
} from "@/lib/booking";
import { useUpdateBookingStatus } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import { CollaboratorDialog } from "@/components/dashboard/CollaboratorDialog";
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
  const { data: gallery } = useGallery(booking.id);
  const isActionable = booking.status === "pending";
  // Collaboration closes once photos are delivered (matches the backend guard).
  const canCollaborate = !gallery?.photos.length;
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

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-4">
        <Avatar className="size-12 shrink-0">
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
        </Link>

        <div className="shrink-0 text-right">
          <p className="font-semibold">{formatPrice(booking.price)}</p>
          {isActionable && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
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
          <CollaboratorDialog booking={booking} />
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
            {canCollaborate && <CollaboratorDialog booking={booking} />}
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
