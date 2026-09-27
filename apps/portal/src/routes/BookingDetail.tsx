import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  MapPin,
  Package,
  Send,
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
  PageContainer,
} from "@lens/ui";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { CollaboratorDialog } from "@/components/dashboard/CollaboratorDialog";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { MessageButton } from "@/components/profile/MessageButton";
import {
  useConfirmReceipt,
  useMyBookings,
} from "@/queries/useBookings";
import { useIncomingBookings, useUpdateBookingStatus } from "@/queries/useDashboard";
import { useGallery } from "@/queries/useStorage";
import {
  BOOKING_STATUS_META,
  commissionAmount,
  photographerPayout,
  canCancel,
  deliveryDeadline,
  deliveryProgress,
  packageSummary,
  remainingAmount,
} from "@/lib/booking";
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
  const updateStatus = useUpdateBookingStatus();

  const backTo = isClient ? "/client/bookings" : "/dashboard/bookings";

  if (source.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-40" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-semibold">Không tìm thấy lịch đặt</h1>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to={backTo}>
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
        </Button>
      </PageContainer>
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

  const decide = (next: "confirmed" | "cancelled") =>
    updateStatus.mutate(
      { id: booking.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === "confirmed"
              ? `Đã xác nhận lịch chụp với ${booking.clientName}`
              : `Đã từ chối và hoàn cọc cho ${booking.clientName}`
          ),
        onError: () => toast.error("Không thể cập nhật, vui lòng thử lại"),
      }
    );

  return (
    <PageContainer>
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {isClient ? "Về lịch đặt của tôi" : "Về quản lý đặt lịch"}
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Main: who / when / where, then what to do next, then photos */}
        <div className="min-w-0 space-y-4">
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
              <MessageButton
                participant={
                  isClient
                    ? { id: booking.photographerId, name: booking.photographerName, role: "photographer" }
                    : { id: booking.clientId, name: booking.clientName, role: "client" }
                }
                size="sm"
                className="shrink-0"
              />
            </div>

            <Separator className="my-4" />

            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                <span className="text-foreground">{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                <span className="text-foreground">{booking.location}</span>
              </div>
              {booking.packageSnapshot && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="size-4" />
                    <span className="text-foreground">
                      {booking.packageSnapshot.name} · {packageSummary(booking.packageSnapshot)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Send className="size-4" />
                    Hạn giao ảnh:{" "}
                    <span className="font-medium text-foreground">
                      {deliveryDeadline(booking.date, booking.packageSnapshot.deliveryDays)}
                    </span>
                  </div>
                </>
              )}
              {booking.collaborators && booking.collaborators.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                  <Users className="size-4" />
                  <span className="text-foreground">
                    Nhóm {booking.collaborators.length + 1} thợ ·{" "}
                    {booking.collaborators.map((c) => c.photographerName).join(", ")}
                  </span>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <BookingActions
            booking={booking}
            isClient={isClient}
            onRelease={release}
            onDecide={decide}
            releasing={confirmReceipt.isPending}
            deciding={updateStatus.isPending}
          />

          {/* Delivery gallery (upload for photographer, view/download for client) */}
          {showGallery && (
            <div className="rounded-3xl border border-border bg-card p-6">
              <h2 className="mb-4 text-base font-semibold">
                {isClient ? "Ảnh đã giao" : "Giao ảnh cho khách"}
              </h2>
              <GalleryPanel
                bookingId={booking.id}
                canUpload={!isClient}
                required={booking.packageSnapshot?.photoCount}
              />
            </div>
          )}
        </div>

        {/* Side: money + progress, kept in view */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="mb-3 text-base font-semibold">Chi phí</h2>
            <div className="space-y-1.5">
              <Row label="Giá buổi chụp" value={formatPrice(booking.price)} tone="muted" />
              <Row
                label={booking.status === "awaiting_deposit" ? "Đặt cọc (chưa trả)" : "Đã đặt cọc"}
                value={formatPrice(booking.depositAmount)}
                tone="muted"
              />
              <Row
                label={
                  booking.status === "held" || booking.status === "released"
                    ? "Đã thanh toán phần còn lại"
                    : "Còn lại"
                }
                value={formatPrice(remainingAmount(booking))}
                tone="muted"
              />
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

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Tiến trình giao dịch</h2>
            <BookingTimeline status={booking.status} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function BookingActions({
  booking,
  isClient,
  onRelease,
  onDecide,
  releasing,
  deciding,
}: {
  booking: Booking;
  isClient: boolean;
  onRelease: () => void;
  onDecide: (next: "confirmed" | "cancelled") => void;
  releasing: boolean;
  deciding: boolean;
}) {
  // Client cards end with "Huỷ lịch" while the booking can still be cancelled —
  // the dialog explains the refund / forfeit before anything happens.
  const wrap = (children: React.ReactNode) => (
    <div className="rounded-3xl border border-border bg-card p-6">
      {children}
      {isClient && canCancel(booking) && (
        <div className="mt-4 flex justify-end border-t border-border pt-3">
          <CancelBookingDialog
            booking={booking}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-destructive"
              >
                Huỷ lịch
              </Button>
            }
          />
        </div>
      )}
    </div>
  );

  // Delivery gates: the client completes only once the package's photo count is
  // delivered; collaboration closes once any photo is delivered (both also
  // enforced in the backend).
  const { data: gallery } = useGallery(booking.id);
  const hasPhotos = !!gallery?.photos.length;
  const progress = deliveryProgress(booking, gallery?.photos.length ?? 0);

  // ── Client actions ─────────────────────────────────────────────────────────
  if (isClient) {
    if (booking.status === "awaiting_deposit")
      return wrap(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Đặt cọc {formatPrice(booking.depositAmount)} để giữ lịch — yêu cầu chỉ
            được gửi tới nhiếp ảnh gia sau khi bạn đặt cọc.
          </p>
          <Button asChild className="shrink-0 rounded-full bg-ember text-white hover:bg-ember/90">
            <Link to={`/client/bookings/${booking.id}/deposit`}>
              Đặt cọc {formatPrice(booking.depositAmount)}
            </Link>
          </Button>
        </div>
      );
    if (booking.status === "pending")
      return wrap(
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Đã đặt cọc {formatPrice(booking.depositAmount)}. Đang chờ nhiếp ảnh gia xác
          nhận — nếu họ từ chối, tiền cọc được hoàn đầy đủ vào ví của bạn.
        </p>
      );
    if (booking.status === "confirmed")
      return wrap(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Nhiếp ảnh gia đã xác nhận. Thanh toán phần còn lại trước buổi chụp.
          </p>
          <Button asChild className="shrink-0 rounded-full">
            <Link to={`/client/bookings/${booking.id}/pay`}>
              Thanh toán {formatPrice(remainingAmount(booking))}
            </Link>
          </Button>
        </div>
      );
    if (booking.status === "held")
      return wrap(
        <div className="space-y-4">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Sàn đang giữ {formatPrice(booking.price)}. Sau khi nhận đủ ảnh, hãy
            xác nhận để giải ngân cho nhiếp ảnh gia.
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <Button
                className="rounded-full"
                disabled={releasing || !progress.complete}
                onClick={onRelease}
              >
                {releasing && <Loader2 className="size-4 animate-spin" />}
                <Check className="size-4" />
                Xác nhận đã nhận ảnh
              </Button>
            </div>
            {!progress.complete && (
              <p className="text-xs text-muted-foreground">
                Bạn có thể xác nhận khi nhiếp ảnh gia giao đủ {progress.required} ảnh theo
                gói (hiện có {progress.delivered}/{progress.required}).
              </p>
            )}
          </div>
        </div>
      );
    return null; // released/cancelled → covered by timeline + breakdown
  }

  // ── Photographer actions ────────────────────────────────────────────────────
  if (booking.status === "pending")
    return wrap(
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          Khách đã đặt cọc {formatPrice(booking.depositAmount)}. Xác nhận hoặc từ chối
          (từ chối sẽ hoàn cọc cho khách).
        </p>
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
              <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Đang chờ khách thanh toán phần còn lại.
            </>
          ) : (
            <>
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
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
        <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        Đã nhận {formatPrice(photographerPayout(booking.price))} (đã trừ phí sàn{" "}
        {formatPrice(commissionAmount(booking.price))}).
      </p>
    );
  return null;
}
