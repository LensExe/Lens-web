import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Send,
  Share2,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Separator,
  Skeleton,
  cn,
  formatPrice,
  toast,
  PageContainer,
} from "@lens/ui";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";
import { timelineStepNumber } from "@/components/bookings/booking-timeline-utils";
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { MessageButton } from "@/components/profile/MessageButton";
import { useConfirmReceipt, useMyBookings } from "@/queries/useBookings";
import {
  useCompleteShoot,
  useIncomingBookings,
  useUpdateBookingStatus,
} from "@/queries/useDashboard";
import { usePhotographer } from "@/queries/usePhotographers";
import { useGallery } from "@/queries/useStorage";
import {
  BOOKING_STATUS_META,
  bookingStatusMeta,
  canCancel,
  deliveryDeadline,
  deliveryProgress,
  isPaymentDue,
  remainingAmount,
} from "@/lib/booking";
import type { Booking, Photographer } from "@/types";

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

function Row({ label, value, tone }: { label: string; value: string; tone?: "muted" | "plus" }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right font-semibold tabular-nums",
          tone === "plus" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type BookingStatusMeta = (typeof BOOKING_STATUS_META)[Booking["status"]];

function BookingSummary({
  booking,
  isClient,
  otherName,
  status,
  photographer,
}: {
  booking: Booking;
  isClient: boolean;
  otherName: string;
  status: BookingStatusMeta;
  photographer?: Photographer | null;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border border-t-[3px] border-t-ember bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar className="size-11 shrink-0 rounded-xl border border-border bg-muted">
          {photographer?.avatar && <AvatarImage src={photographer.avatar} alt={otherName} />}
          <AvatarFallback className="rounded-xl bg-muted text-xs font-semibold text-muted-foreground">
            {initialsOf(otherName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{otherName}</h2>
            <span
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}
            >
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
            <span>{booking.style}</span>
            <span className="text-border">·</span>
            <span>{isClient ? "Nhiếp ảnh gia Lens" : "Khách hàng Lens"}</span>
            {isClient && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                <Star className="size-3 fill-current" />
                {photographer?.rating
                  ? `${photographer.rating.toFixed(1)}/5.0`
                  : "Chưa có đánh giá"}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MessageButton
            participant={
              isClient
                ? {
                    id: booking.photographerId,
                    name: booking.photographerName,
                    role: "photographer",
                  }
                : { id: booking.clientId, name: booking.clientName, role: "client" }
            }
            label="Nhắn tin"
            size="sm"
            className="h-8 rounded-lg px-2.5 text-[10px]"
          />
        </div>
      </div>

      <Separator className="my-4" />

      <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        <DetailItem
          icon={<CalendarDays className="size-3.5" />}
          label="Thời gian chụp"
          value={`${formatDate(booking.date)}${booking.timeSlot ? ` · ${booking.timeSlot}` : ""}`}
        />
        <DetailItem
          icon={<MapPin className="size-3.5" />}
          label="Địa điểm"
          value={booking.location}
        />
        <DetailItem
          icon={<Package className="size-3.5" />}
          label="Gói dịch vụ"
          value={
            booking.packageSnapshot
              ? `${booking.packageSnapshot.name} · ${booking.packageSnapshot.durationHours} giờ · ${booking.packageSnapshot.photoCount} ảnh`
              : booking.style
          }
        />
        {booking.packageSnapshot ? (
          <DetailItem
            icon={<Send className="size-3.5" />}
            label="Hạn giao ảnh"
            value={
              booking.packageSnapshot.deliveryDays
                ? deliveryDeadline(booking.date, booking.packageSnapshot.deliveryDays)
                : "Backend chưa có hạn giao ảnh"
            }
            badge={
              isPaymentDue(booking)
                ? "Chờ thanh toán"
                : booking.status === "held"
                  ? "Đang thực hiện"
                  : undefined
            }
          />
        ) : null}
        {booking.collaborators && booking.collaborators.length > 0 && (
          <div className="flex items-start gap-2 sm:col-span-2">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Users className="size-3.5" />
            </span>
            <div className="min-w-0">
              <dt className="text-[10px] text-muted-foreground">Đội ngũ thực hiện</dt>
              <dd className="mt-0.5 text-xs font-medium">
                Nhóm {booking.collaborators.length + 1} thợ ·{" "}
                {booking.collaborators.map((c) => c.photographerName).join(", ")}
              </dd>
            </div>
          </div>
        )}
      </dl>
    </section>
  );
}

function DetailItem({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <span>{value}</span>
          {badge && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {badge}
            </span>
          )}
        </dd>
      </div>
    </div>
  );
}

function CostSummary({ booking }: { booking: Booking }) {
  const paid = booking.paidAmount ?? 0;
  const depositPaid = paid >= booking.depositAmount;
  const isCompleted = booking.status === "released";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Chi phí</h2>
        <span className="rounded bg-muted px-1.5 py-1 text-[9px] text-muted-foreground">
          VND (₫)
        </span>
      </div>
      <Separator className="my-3" />
      <div className="space-y-3">
        <Row label="Giá buổi chụp" value={formatPrice(booking.price)} />
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">
            {depositPaid ? "Đã đặt cọc" : "Tiền cọc"}{" "}
            <span className="ml-1 rounded bg-emerald-50 px-1 text-[9px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              30%
            </span>
          </span>
          <span className="font-semibold tabular-nums">{formatPrice(booking.depositAmount)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">
            {isCompleted ? "Đã thanh toán phần còn lại" : "Còn lại"}{" "}
            <span className="ml-1 rounded bg-muted px-1 text-[9px] text-muted-foreground">70%</span>
          </span>
          <span className="font-semibold tabular-nums">
            {formatPrice(remainingAmount(booking))}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground">
            {booking.status === "cancelled" ? "Đã hoàn / đã trả" : "Tổng đã trả"}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            {paid >= booking.price
              ? "Đã thanh toán đủ"
              : paid > 0
                ? `Đã thanh toán ${formatPrice(paid)}`
                : "Chưa thanh toán"}
          </p>
        </div>
        <span className="text-base font-bold tabular-nums">{formatPrice(paid)}</span>
      </div>
    </section>
  );
}

// timelineStep has been moved to BookingTimeline.tsx as timelineStepNumber

export function BookingDetailPage({ mode }: { mode: "client" | "photographer" }) {
  const { booking_id = "" } = useParams();
  const navigate = useNavigate();
  const isClient = mode === "client";

  const clientBookings = useMyBookings();
  const incoming = useIncomingBookings();
  const source = isClient ? clientBookings : incoming;
  const booking = (source.data ?? []).find((b) => b.id === booking_id);
  const galleryQuery = useGallery(booking?.id ?? booking_id);
  const photographerQuery = usePhotographer(isClient ? (booking?.photographerId ?? "") : "");

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

  const status = bookingStatusMeta(booking);
  const otherName = isClient ? booking.photographerName : booking.clientName;
  const showGallery = booking.status === "held" || booking.status === "released";
  const hasRemainingPayment = isClient && isPaymentDue(booking);
  const showActionCard =
    !isClient ||
    booking.status !== "held" ||
    Boolean(galleryQuery.data?.photos.length) ||
    canCancel(booking) ||
    hasRemainingPayment;
  const bookingCode = booking.id.toUpperCase().replace(/^BK-/, "LS-");

  const shareBooking = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      toast.success("Đã sao chép liên kết lịch chụp");
    } catch {
      toast("Bạn có thể sao chép đường dẫn trên thanh địa chỉ để chia sẻ");
    }
  };

  const release = () =>
    confirmReceipt.mutate(booking.id, {
      onSuccess: () => toast.success("Đã xác nhận nhận ảnh"),
      onError: () => toast.error("Không thể xác nhận, vui lòng thử lại"),
    });

  const decide = (next: "confirmed" | "cancelled" | "held") =>
    updateStatus.mutate(
      { id: booking.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === "confirmed"
              ? `Đã xác nhận lịch chụp với ${booking.clientName}`
              : next === "held"
                ? "Đã bắt đầu buổi chụp"
                : `Đã từ chối yêu cầu đặt lịch với ${booking.clientName}`,
          ),
        onError: () => toast.error("Không thể cập nhật, vui lòng thử lại"),
      },
    );

  return (
    <PageContainer className="max-w-[1180px] pb-10">
      <div className="mb-5 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="group inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          {isClient ? "Quay lại danh sách lịch đặt" : "Quay lại quản lý lịch đặt"}
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">
                Chi tiết lịch chụp #{bookingCode}
              </h1>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  status.className,
                )}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ngày chụp: {formatDate(booking.date)} · Mã đặt lịch: {booking.id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={shareBooking}
            >
              <Share2 className="size-3.5" />
              Chia sẻ
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.72fr)_minmax(270px,0.88fr)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <BookingSummary
            booking={booking}
            isClient={isClient}
            otherName={otherName}
            status={status}
            photographer={photographerQuery.data}
          />

          {showGallery && (
            <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">
                    {isClient ? "Ảnh đã giao" : "Giao ảnh cho khách"}
                  </h2>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isClient
                      ? "Kiểm tra và duyệt các sản phẩm sau buổi chụp"
                      : "Tải lên các sản phẩm đã hoàn thiện cho khách hàng"}
                  </p>
                </div>
                <span className="rounded-lg bg-muted/60 px-3 py-2 text-[10px] text-muted-foreground">
                  {galleryQuery.data?.photos.length ?? 0} ảnh
                </span>
              </div>
              <div className="mt-4">
                <GalleryPanel
                  bookingId={booking.id}
                  canUpload={!isClient}
                  canPublish={booking.backendStatus === "shot"}
                  required={booking.packageSnapshot?.photoCount}
                />
              </div>
            </section>
          )}

          {showActionCard && (
            <BookingActions
              booking={booking}
              isClient={isClient}
              onRelease={release}
              onDecide={decide}
              releasing={confirmReceipt.isPending}
              deciding={updateStatus.isPending}
            />
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/75 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                Thanh toán qua Lens
              </p>
              <p className="mt-0.5 text-[10px] leading-4 text-emerald-800/75 dark:text-emerald-200/70">
                Backend theo dõi trạng thái giao dịch và chỉ hoàn tất booking sau khi khách xác nhận
                gallery đã giao.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <CostSummary booking={booking} />
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27/.035),0_12px_28px_-24px_rgb(24_24_27/0.24)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Tiến trình giao dịch</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Bước {timelineStepNumber(booking.status, booking.backendStatus)}/6
              </span>
            </div>
            <BookingTimeline status={booking.status} backendStatus={booking.backendStatus} />
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
  onDecide: (next: "confirmed" | "cancelled" | "held") => void;
  releasing: boolean;
  deciding: boolean;
}) {
  // Keep cancellation inside the booking detail so the overview stays focused
  // on the next required action.
  const wrap = (children: React.ReactNode) => (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27/.035),0_12px_28px_-24px_rgb(24_24_27/0.24)] sm:p-5">
      {children}
      {isClient && canCancel(booking) && (
        <div className="mt-4 flex justify-end border-t border-border pt-3">
          <CancelBookingDialog
            booking={booking}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-destructive/25 px-3 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/5"
              >
                <X className="size-3.5" />
                Huỷ lịch
              </Button>
            }
          />
        </div>
      )}
    </div>
  );

  const { data: gallery } = useGallery(booking.id);
  const depositPaid = (booking.paidAmount ?? 0) >= booking.depositAmount;
  const progress = deliveryProgress(booking, gallery?.photos.length ?? 0);
  const completeShoot = useCompleteShoot();
  const markShootComplete = () =>
    completeShoot.mutate(booking.id, {
      onSuccess: () => toast.success("Đã cập nhật buổi chụp hoàn tất"),
      onError: () => toast.error("Không thể cập nhật trạng thái buổi chụp"),
    });

  // ── Client actions ─────────────────────────────────────────────────────────
  if (isClient) {
    if (booking.status === "awaiting_deposit")
      return wrap(
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Wallet className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            Đặt cọc {formatPrice(booking.depositAmount)} để nhiếp ảnh gia có thể xác nhận yêu cầu và
            giữ lịch cho bạn.
          </p>
          <Button asChild className="shrink-0 rounded-full bg-ember text-white hover:bg-ember/90">
            <Link to={`/client/bookings/${booking.id}/deposit`}>
              Đặt cọc {formatPrice(booking.depositAmount)}
            </Link>
          </Button>
        </div>,
      );
    if (booking.status === "pending")
      return wrap(
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {depositPaid
            ? "Đã thanh toán tiền cọc. Yêu cầu đang chờ nhiếp ảnh gia xác nhận."
            : "Thanh toán tiền cọc trước để nhiếp ảnh gia có thể xác nhận yêu cầu."}
        </p>,
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
        </div>,
      );
    if (booking.status === "held")
      return wrap(
        <div className="space-y-4">
          {isPaymentDue(booking) && (
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Wallet className="mt-0.5 size-4 shrink-0 text-ember" />
                Thanh toán phần còn lại để hoàn tất giao dịch của buổi chụp.
              </p>
              <Button
                asChild
                className="shrink-0 rounded-full bg-ember text-white hover:bg-ember/90"
              >
                <Link to={`/client/bookings/${booking.id}/pay`}>
                  Thanh toán {formatPrice(remainingAmount(booking))}
                </Link>
              </Button>
            </div>
          )}
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {gallery?.publishedAt
              ? `Ảnh đã giao. Bạn đã thanh toán ${formatPrice(booking.paidAmount ?? 0)}; xác nhận sau khi kiểm tra đủ ảnh.`
              : "Nhiếp ảnh gia đang thực hiện buổi chụp. Gallery sẽ xuất hiện sau khi họ giao ảnh."}
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <Button
                className="rounded-full"
                disabled={
                  releasing || isPaymentDue(booking) || !progress.complete || !gallery?.publishedAt
                }
                onClick={onRelease}
              >
                {releasing && <Loader2 className="size-4 animate-spin" />}
                <Check className="size-4" />
                Xác nhận đã nhận ảnh
              </Button>
            </div>
            {gallery?.publishedAt && !progress.complete && (
              <p className="text-xs text-muted-foreground">
                Bạn có thể xác nhận khi nhiếp ảnh gia giao đủ {progress.required} ảnh theo gói (hiện
                có {progress.delivered}/{progress.required}).
              </p>
            )}
          </div>
        </div>,
      );
    return null; // released/cancelled → covered by timeline + breakdown
  }

  // ── Photographer actions ────────────────────────────────────────────────────
  const runStatusAction = (action: PhotographerStatusAction) => {
    if (action === "complete") {
      markShootComplete();
      return;
    }
    onDecide(action);
  };

  if (booking.status === "pending")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        actions={[
          { value: "confirmed", label: "Xác nhận booking" },
          { value: "cancelled", label: "Từ chối booking" },
        ]}
        description="Khách đã thanh toán tiền cọc. Bạn có thể xác nhận booking sau khi kiểm tra lịch và địa điểm."
        busy={deciding}
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "awaiting_deposit")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        description="Booking đang chờ khách thanh toán tiền cọc. Bạn chưa thể xác nhận khi khoản cọc chưa được ghi nhận."
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "confirmed")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        actions={[{ value: "held", label: "Bắt đầu buổi chụp" }]}
        description="Tiền cọc đã thanh toán. Bạn có thể bắt đầu buổi chụp; khách sẽ thanh toán phần còn lại sau khi bạn đánh dấu đã chụp."
        busy={deciding}
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "held" && booking.backendStatus === "accepted")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        actions={[{ value: "held", label: "Bắt đầu buổi chụp" }]}
        description="Thanh toán đã được ghi nhận. Bắt đầu buổi chụp khi đến lịch."
        busy={deciding}
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "held" && booking.backendStatus === "in_progress")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        actions={[{ value: "complete", label: "Đánh dấu đã chụp" }]}
        description="Buổi chụp đang diễn ra. Cập nhật khi bạn đã hoàn tất để bắt đầu giao gallery cho khách."
        busy={completeShoot.isPending}
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "held" && booking.backendStatus === "shot")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        description="Bạn đã đánh dấu đã chụp. Chờ khách thanh toán phần còn lại trước khi hoàn tất booking; bạn vẫn có thể giao gallery."
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "held")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        description="Buổi chụp đã hoàn tất. Tải ảnh lên và giao gallery cho khách."
        onUpdate={runStatusAction}
      />,
    );
  if (booking.status === "released")
    return wrap(
      <PhotographerStatusPanel
        booking={booking}
        description="Booking đã được backend hoàn tất. Số dư và giao dịch thực nhận xem trong Ví Lens."
        onUpdate={runStatusAction}
      />,
    );
  return wrap(
    <PhotographerStatusPanel
      booking={booking}
      description="Booking đã kết thúc và không còn trạng thái nào cần cập nhật."
      onUpdate={runStatusAction}
    />,
  );
}

type PhotographerStatusAction = "confirmed" | "cancelled" | "held" | "complete";

function PhotographerStatusPanel({
  booking,
  actions = [],
  description,
  busy = false,
  onUpdate,
}: {
  booking: Booking;
  actions?: { value: PhotographerStatusAction; label: string }[];
  description: string;
  busy?: boolean;
  onUpdate: (action: PhotographerStatusAction) => void;
}) {
  const actionKey = actions.map((action) => action.value).join(",");
  const defaultAction = actions[0]?.value ?? "";
  const [selection, setSelection] = useState<{
    key: string;
    value: PhotographerStatusAction | "";
  }>({ key: actionKey, value: defaultAction });
  const selectedAction = selection.key === actionKey ? selection.value : defaultAction;
  const status = bookingStatusMeta(booking);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
          <RefreshCw className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Cập nhật trạng thái booking</h3>
            <span
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}
            >
              Hiện tại: {status.label}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center">
          <select
            value={selectedAction}
            onChange={(event) =>
              setSelection({
                key: actionKey,
                value: event.target.value as PhotographerStatusAction,
              })
            }
            className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
            aria-label="Trạng thái booking tiếp theo"
          >
            {actions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
          <Button
            className="h-9 shrink-0 rounded-xl text-xs"
            disabled={!selectedAction || busy}
            onClick={() => selectedAction && onUpdate(selectedAction)}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Cập nhật trạng thái
          </Button>
        </div>
      ) : (
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Chưa có thao tác chuyển trạng thái tiếp theo từ bước này.
        </p>
      )}
    </div>
  );
}
