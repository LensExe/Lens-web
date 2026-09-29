import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  Clock,
  Download,
  HelpCircle,
  Loader2,
  MapPin,
  Package,
  Phone,
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
import { GalleryPanel } from "@/components/storage/GalleryPanel";
import { CancelBookingDialog } from "@/components/bookings/CancelBookingDialog";
import { MessageButton } from "@/components/profile/MessageButton";
import {
  useConfirmReceipt,
  useMyBookings,
} from "@/queries/useBookings";
import { useIncomingBookings, useUpdateBookingStatus } from "@/queries/useDashboard";
import { usePhotographer } from "@/queries/usePhotographers";
import { useGallery } from "@/queries/useStorage";
import {
  BOOKING_STATUS_META,
  commissionAmount,
  photographerPayout,
  canCancel,
  deliveryDeadline,
  deliveryProgress,
  remainingAmount,
} from "@/lib/booking";
import { formatCoins } from "@/lib/wallet";
import type { Booking, Photographer } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
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
          tone === "plus" && "text-emerald-600 dark:text-emerald-400"
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
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", status.className)}>
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
            <span>{booking.style}</span>
            <span className="text-border">·</span>
            <span>{isClient ? "Lens Pro Photographer" : "Khách hàng Lens"}</span>
            {isClient && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                <Star className="size-3 fill-current" />
                {photographer?.rating?.toFixed(1) ?? "4.9"}/5.0
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MessageButton
            participant={
              isClient
                ? { id: booking.photographerId, name: booking.photographerName, role: "photographer" }
                : { id: booking.clientId, name: booking.clientName, role: "client" }
            }
            label="Nhắn tin"
            size="sm"
            className="h-8 rounded-lg px-2.5 text-[10px]"
          />
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-lg"
            aria-label="Gọi điện"
            onClick={() =>
              toast(
                booking.contactPhone
                  ? `Số điện thoại liên hệ: ${booking.contactPhone}`
                  : "Chưa có số điện thoại liên hệ"
              )
            }
          >
            <Phone className="size-3.5" />
          </Button>
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
            value={deliveryDeadline(booking.date, booking.packageSnapshot.deliveryDays)}
            badge={booking.status === "held" ? "Đang thực hiện" : undefined}
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
                Nhóm {booking.collaborators.length + 1} thợ · {booking.collaborators.map((c) => c.photographerName).join(", ")}
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
          {badge && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{badge}</span>}
        </dd>
      </div>
    </div>
  );
}

function CostSummary({ booking, isClient }: { booking: Booking; isClient: boolean }) {
  const paid =
    booking.status === "held" || booking.status === "released"
      ? booking.price - (booking.coinsRedeemed ?? 0)
      : booking.status === "pending" || booking.status === "confirmed"
        ? booking.depositAmount
        : 0;
  const isCompleted = booking.status === "held" || booking.status === "released";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Chi phí</h2>
        <span className="rounded bg-muted px-1.5 py-1 text-[9px] text-muted-foreground">VND (₫)</span>
      </div>
      <Separator className="my-3" />
      <div className="space-y-3">
        <Row label="Giá buổi chụp" value={formatPrice(booking.price)} />
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">Đã đặt cọc <span className="ml-1 rounded bg-emerald-50 px-1 text-[9px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">30%</span></span>
          <span className="font-semibold tabular-nums">{formatPrice(booking.depositAmount)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-muted-foreground">
            {isCompleted ? "Đã thanh toán phần còn lại" : "Còn lại"}{" "}
            <span className="ml-1 rounded bg-muted px-1 text-[9px] text-muted-foreground">70%</span>
          </span>
          <span className="font-semibold tabular-nums">{formatPrice(remainingAmount(booking))}</span>
        </div>
        {booking.coinsRedeemed ? (
          <Row label="Lens Xu đã dùng" value={`−${formatPrice(booking.coinsRedeemed)}`} />
        ) : null}
        {isClient && booking.coinsEarned ? (
          <Row label="Lens Xu đã hoàn" value={`+${formatCoins(booking.coinsEarned)}`} tone="plus" />
        ) : null}
        {!isClient && (
          <>
            <Row label="Phí sàn" value={`−${formatPrice(commissionAmount(booking.price))}`} />
            <Row label="Bạn nhận" value={formatPrice(photographerPayout(booking.price))} tone="plus" />
          </>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-4 border-t border-border pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground">{booking.status === "cancelled" ? "Đã hoàn / đã trả" : "Tổng đã trả"}</p>
          <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            {booking.status === "held" || booking.status === "released" ? "Đã thanh toán 100%" : paid ? "Đã thanh toán tiền cọc" : "Chưa thanh toán"}
          </p>
        </div>
        <span className="text-base font-bold tabular-nums">{formatPrice(paid)}</span>
      </div>
    </section>
  );
}

function timelineStep(status: Booking["status"]): number {
  if (status === "cancelled") return 0;
  if (status === "released") return 5;
  return {
    awaiting_deposit: 1,
    pending: 2,
    confirmed: 3,
    held: 4,
  }[status];
}

export function BookingDetail({ mode }: { mode: "client" | "photographer" }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const isClient = mode === "client";

  const clientBookings = useMyBookings();
  const incoming = useIncomingBookings();
  const source = isClient ? clientBookings : incoming;
  const booking = (source.data ?? []).find((b) => b.id === id);
  const galleryQuery = useGallery(booking?.id ?? id);
  const photographerQuery = usePhotographer(isClient ? booking?.photographerId ?? "" : "");

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
  const showActionCard =
    !isClient ||
    booking.status !== "held" ||
    Boolean(galleryQuery.data?.photos.length) ||
    canCancel(booking);
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
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", status.className)}>
                {status.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ngày chụp: {formatDate(booking.date)} · Mã đặt lịch: {booking.id}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={shareBooking}>
              <Share2 className="size-3.5" />
              Chia sẻ
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => toast("Tính năng tải hoá đơn sẽ sớm khả dụng")}
            >
              <Download className="size-3.5" />
              Tải hoá đơn VAT
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
                  <h2 className="text-sm font-semibold">{isClient ? "Ảnh đã giao" : "Giao ảnh cho khách"}</h2>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isClient ? "Kiểm tra và duyệt các sản phẩm sau buổi chụp" : "Tải lên các sản phẩm đã hoàn thiện cho khách hàng"}
                  </p>
                </div>
                <div className="flex w-fit items-center gap-1 rounded-lg bg-muted/60 p-1 text-[10px]">
                  <span className="rounded-md bg-card px-2 py-1 font-medium shadow-sm">
                    Tất cả ảnh ({galleryQuery.data?.photos.length ?? 0})
                  </span>
                  <span className="px-2 py-1 text-muted-foreground">Ảnh gốc</span>
                  <span className="px-2 py-1 text-muted-foreground">
                    Ảnh hậu kỳ ({booking.packageSnapshot?.photoCount ?? 0})
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <GalleryPanel
                  bookingId={booking.id}
                  canUpload={!isClient}
                  required={booking.packageSnapshot?.photoCount}
                  emptyActions={
                    isClient ? (
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-[11px]"
                          onClick={() => toast("Đã gửi lời nhắc giao ảnh đến nhiếp ảnh gia")}
                        >
                          <Clock className="size-3" />
                          Nhắc thợ giao đúng hạn
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 rounded-lg bg-ember text-[11px] text-white hover:bg-ember/90"
                          onClick={() => toast("Quy định nghiệm thu sẽ được mở trong phiên bản tiếp theo")}
                        >
                          <ShieldCheck className="size-3" />
                          Quy định nghiệm thu
                        </Button>
                      </div>
                    ) : undefined
                  }
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
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Lens Safe &amp; Bảo vệ tiền cọc 100%</p>
              <p className="mt-0.5 text-[10px] leading-4 text-emerald-800/75 dark:text-emerald-200/70">
                Khoản tiền thanh toán của bạn được tạm giữ an toàn tại hệ thống Lens. Tiền chỉ được giải ngân khi bạn kiểm tra và duyệt toàn bộ ảnh nhận được.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <CostSummary booking={booking} isClient={isClient} />
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Tiến trình giao dịch</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                Bước {timelineStep(booking.status)}/5
              </span>
            </div>
            <BookingTimeline status={booking.status} />
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)]">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <HelpCircle className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">Cần hỗ trợ đơn hàng?</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Lens Care 24/7 · phản hồi sớm</p>
            </div>
            <Button variant="outline" size="sm" className="h-7 rounded-md px-2.5 text-[10px]" onClick={() => toast("Lens Care sẽ hỗ trợ bạn sớm nhất")}>Trợ giúp</Button>
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
  // Keep cancellation inside the booking detail so the overview stays focused
  // on the next required action. The dialog explains refund / forfeit first.
  const wrap = (children: React.ReactNode) => (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27_/_.035),0_12px_28px_-24px_rgb(24_24_27_/_0.24)] sm:p-5">
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
