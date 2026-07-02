import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Button,
  Separator,
  Skeleton,
  cn,
  formatPrice,
  toast,
} from "@lens/ui";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { CollaboratorDialog } from "@/components/dashboard/CollaboratorDialog";
import {
  useCancelBooking,
  useConfirmReceipt,
  useMyBookings,
} from "@/queries/useBookings";
import { useIncomingBookings, useUpdateBookingStatus } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import { BOOKING_STATUS_META, commissionAmount, photographerPayout } from "@/lib/booking";
import { formatCoins } from "@/lib/wallet";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function Row({ label, value, tone }: { label: string; value: string; tone?: "muted" | "plus" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium",
          tone === "plus" && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function BookingDetail({ mode }: { mode: "client" | "photographer" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const isClient = mode === "client";

  const clientBookings = useMyBookings();
  const incoming = useIncomingBookings();
  const source = isClient ? clientBookings : incoming;
  const booking = (source.data ?? []).find((b) => b.id === id);

  const confirmReceipt = useConfirmReceipt();
  const cancelBooking = useCancelBooking();
  const updateStatus = useUpdateBookingStatus();
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const backTo = isClient ? "/client/bookings" : "/dashboard/bookings";

  if (source.isLoading) {
    return (
      <div className="mx-auto max-w-[820px] px-5 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-40 w-full rounded-3xl" />
        <Skeleton className="mt-4 h-56 w-full rounded-3xl" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[820px] flex-col items-center justify-center px-5 text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy lịch đặt</h1>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to={backTo}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  const status = BOOKING_STATUS_META[booking.status];
  const otherName = isClient ? booking.photographerName : booking.clientName;
  const showGallery = booking.status === "held" || booking.status === "released";

  const release = () =>
    confirmReceipt.mutate(booking.id, {
      onSuccess: (updated) => {
        const earned = updated.coinsEarned ?? 0;
        toast.success(
          earned > 0
            ? `Đã xác nhận · nhận +${formatCoins(earned)} hoàn lại`
            : "Đã xác nhận nhận ảnh"
        );
      },
      onError: () => toast.error("Không thể xác nhận, vui lòng thử lại"),
    });

  const cancel = () =>
    cancelBooking.mutate(booking.id, {
      onSuccess: () => {
        toast.success(`Đã huỷ và hoàn lại ${formatPrice(booking.price)}`);
        setConfirmingCancel(false);
      },
      onError: () => toast.error("Không thể huỷ lịch, vui lòng thử lại"),
    });

  const decide = (next: "confirmed" | "cancelled") =>
    updateStatus.mutate(
      { id: booking.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === "confirmed"
              ? `Đã xác nhận lịch chụp với ${booking.clientName}`
              : `Đã từ chối yêu cầu của ${booking.clientName}`
          ),
        onError: () => toast.error("Không thể cập nhật, vui lòng thử lại"),
      }
    );

  return (
    <div className="mx-auto max-w-[820px] px-5 py-8">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {isClient ? "Về lịch đặt của tôi" : "Về quản lý đặt lịch"}
      </button>

      {/* Summary */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 shrink-0">
            <AvatarFallback>{initialsOf(otherName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{otherName}</h1>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{booking.style}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <dl className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            <span className="text-foreground">{formatDate(booking.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span className="text-foreground">{booking.location}</span>
          </div>
          {booking.collaborators && booking.collaborators.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span className="text-foreground">
                Nhóm {booking.collaborators.length + 1} thợ ·{" "}
                {booking.collaborators.map((c) => c.photographerName).join(", ")}
              </span>
            </div>
          )}
        </dl>

        <Separator className="my-4" />

        {/* Price breakdown */}
        <div className="space-y-1.5">
          <Row label="Giá buổi chụp" value={formatPrice(booking.price)} tone="muted" />
          {booking.coinsRedeemed ? (
            <Row label="Đã dùng Lens Xu" value={`−${formatPrice(booking.coinsRedeemed)}`} tone="muted" />
          ) : null}
          {isClient && booking.coinsEarned ? (
            <Row label="Lens Xu đã hoàn" value={`+${formatCoins(booking.coinsEarned)}`} tone="plus" />
          ) : null}
          {!isClient && (
            <>
              <Row label="Phí sàn" value={`−${formatPrice(commissionAmount(booking.price))}`} tone="muted" />
              <Row label="Bạn nhận" value={formatPrice(photographerPayout(booking.price))} />
            </>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold">Tiến trình giao dịch</h2>
        <BookingTimeline status={booking.status} />
      </div>

      {/* Actions */}
      <BookingActions
        booking={booking}
        isClient={isClient}
        confirmingCancel={confirmingCancel}
        setConfirmingCancel={setConfirmingCancel}
        onRelease={release}
        onCancel={cancel}
        onDecide={decide}
        releasing={confirmReceipt.isPending}
        cancelling={cancelBooking.isPending}
        deciding={updateStatus.isPending}
      />

      {/* Delivery gallery (upload for photographer, view/download for client) */}
      {showGallery && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">
            {isClient ? "Ảnh đã giao" : "Giao ảnh cho khách"}
          </h2>
          <GalleryPanel bookingId={booking.id} canUpload={!isClient} />
        </div>
      )}
    </div>
  );
}

function BookingActions({
  booking,
  isClient,
  confirmingCancel,
  setConfirmingCancel,
  onRelease,
  onCancel,
  onDecide,
  releasing,
  cancelling,
  deciding,
}: {
  booking: Booking;
  isClient: boolean;
  confirmingCancel: boolean;
  setConfirmingCancel: (v: boolean) => void;
  onRelease: () => void;
  onCancel: () => void;
  onDecide: (next: "confirmed" | "cancelled") => void;
  releasing: boolean;
  cancelling: boolean;
  deciding: boolean;
}) {
  const wrap = (children: React.ReactNode) => (
    <div className="mt-4 rounded-3xl border border-border bg-card p-6">{children}</div>
  );

  // Delivery gates: the client completes only after photos arrive; collaboration
  // closes once photos are delivered (both also enforced in the backend).
  const { data: gallery } = useGallery(booking.id);
  const hasPhotos = !!gallery?.photos.length;

  // ── Client actions ─────────────────────────────────────────────────────────
  if (isClient) {
    if (booking.status === "pending")
      return wrap(
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          Đang chờ nhiếp ảnh gia xác nhận lịch chụp.
        </p>
      );
    if (booking.status === "confirmed")
      return wrap(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Nhiếp ảnh gia đã xác nhận. Thanh toán để giữ lịch.
          </p>
          <Button asChild className="rounded-full">
            <Link to={`/client/bookings/${booking.id}/pay`}>
              Thanh toán {formatPrice(booking.price)}
            </Link>
          </Button>
        </div>
      );
    if (booking.status === "held")
      return wrap(
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
            Sàn đang giữ {formatPrice(booking.price)}. Sau khi nhận đủ ảnh, hãy
            xác nhận để giải ngân cho nhiếp ảnh gia.
          </p>
          {confirmingCancel ? (
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Huỷ và hoàn lại {formatPrice(booking.price)} cho bạn?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setConfirmingCancel(false)}>
                  Giữ lịch
                </Button>
                <Button variant="destructive" size="sm" className="rounded-full" disabled={cancelling} onClick={onCancel}>
                  {cancelling && <Loader2 className="size-4 animate-spin" />}
                  Huỷ & hoàn tiền
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  className="rounded-full"
                  disabled={releasing || !hasPhotos}
                  onClick={onRelease}
                >
                  {releasing && <Loader2 className="size-4 animate-spin" />}
                  <Check className="size-4" />
                  Xác nhận đã nhận ảnh
                </Button>
                <Button variant="outline" className="rounded-full" onClick={() => setConfirmingCancel(true)}>
                  Huỷ & hoàn tiền
                </Button>
              </div>
              {!hasPhotos && (
                <p className="text-xs text-muted-foreground">
                  Bạn có thể xác nhận sau khi nhiếp ảnh gia giao ảnh.
                </p>
              )}
            </div>
          )}
        </div>
      );
    return null; // released/cancelled → covered by timeline + breakdown
  }

  // ── Photographer actions ────────────────────────────────────────────────────
  if (booking.status === "pending")
    return wrap(
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Xác nhận hoặc từ chối yêu cầu này.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="rounded-full" disabled={deciding} onClick={() => onDecide("cancelled")}>
            <X className="size-4" />
            Từ chối
          </Button>
          <Button className="rounded-full" disabled={deciding} onClick={() => onDecide("confirmed")}>
            <Check className="size-4" />
            Xác nhận
          </Button>
        </div>
      </div>
    );
  if (booking.status === "confirmed" || booking.status === "held")
    return wrap(
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          {booking.status === "confirmed" ? (
            <>
              <Clock className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              Đang chờ khách thanh toán để giữ lịch.
            </>
          ) : (
            <>
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-violet-600 dark:text-violet-400" />
              Tiền đang được sàn giữ. Bạn nhận {formatPrice(photographerPayout(booking.price))}{" "}
              sau khi khách xác nhận đã nhận ảnh.
            </>
          )}
        </p>
        {hasPhotos ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            Đã giao ảnh — không thể ghép thợ nữa
          </span>
        ) : (
          <CollaboratorDialog booking={booking} />
        )}
      </div>
    );
  if (booking.status === "released")
    return wrap(
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Wallet className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        Đã nhận {formatPrice(photographerPayout(booking.price))} (đã trừ phí sàn{" "}
        {formatPrice(commissionAmount(booking.price))}).
      </p>
    );
  return null;
}
