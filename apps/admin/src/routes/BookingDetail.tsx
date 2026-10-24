import { Link, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, CalendarDays, Clock3, Images, Package, UsersRound, Wallet } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  PageContainer,
  PageHeader,
  Skeleton,
  TONE_CHIP,
  formatPrice,
} from "@lens/ui";
import { StatusPill } from "@/components/StatusPill";
import { useAdminBookingDetail, useAdminBookingTimeline } from "@/queries/useAdminBookings";
import { formatDate } from "@/lib/format";
import type { BookingLifecycleStatus } from "@/types/backend-api";
import type { StatusMeta } from "@/lib/status";

const BOOKING_STATUS_META: Record<BookingLifecycleStatus, StatusMeta> = {
  pending: { label: "Chờ xác nhận", className: TONE_CHIP.amber },
  accepted: { label: "Đã xác nhận", className: TONE_CHIP.sky },
  rejected: { label: "Đã từ chối", className: TONE_CHIP.rose },
  cancelled: { label: "Đã hủy", className: TONE_CHIP.neutral },
  expired: { label: "Hết hạn", className: TONE_CHIP.neutral },
  in_progress: { label: "Đang thực hiện", className: TONE_CHIP.violet },
  shot: { label: "Đã chụp", className: TONE_CHIP.violet },
  completed: { label: "Hoàn thành", className: TONE_CHIP.emerald },
};

const ACTOR_LABEL: Record<string, string> = {
  customer: "Khách hàng",
  photographer: "Nhiếp ảnh gia",
  admin: "Quản trị viên",
  system: "Hệ thống",
};

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const TIME_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
});

export function BookingDetail() {
  const { id = "" } = useParams();
  const bookingQuery = useAdminBookingDetail(id);
  const timelineQuery = useAdminBookingTimeline(id);

  if (bookingQuery.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="mb-5 h-5 w-44" />
        <Skeleton className="h-12 w-72" />
        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
            <Skeleton className="h-60 rounded-3xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (bookingQuery.isError || !bookingQuery.data) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold">
          {bookingQuery.isError ? "Không tải được chi tiết booking" : "Không tìm thấy booking"}
        </p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Booking có thể đã bị xóa hoặc bạn không có quyền xem dữ liệu này.
        </p>
        <Button asChild variant="outline" className="mt-5 rounded-full">
          <Link to="/bookings">
            <ArrowLeft className="size-4" />
            Quay lại danh sách
          </Link>
        </Button>
      </PageContainer>
    );
  }

  const booking = bookingQuery.data;
  const packageInfo = booking.package_snapshot ?? booking.booking_plan;
  const paidAmount = booking.paid_amount ?? 0;
  const remainingAmount = Math.max(0, booking.total_amount - paidAmount);
  const paidPercent =
    booking.total_amount > 0
      ? Math.min(100, Math.max(0, (paidAmount / booking.total_amount) * 100))
      : 0;

  return (
    <PageContainer className="max-w-[1440px]">
      <Link
        to="/bookings"
        className="group mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Quay lại danh sách booking
      </Link>

      <PageHeader
        className="mb-6"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Chi tiết booking
            <StatusPill meta={BOOKING_STATUS_META[booking.status]} />
          </span>
        }
        description={`#${booking.id.toUpperCase()}`}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={CalendarDays} title="Thông tin buổi chụp" />
            <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <DetailField label="Tên buổi chụp" value={packageInfo?.name ?? "Buổi chụp"} />
              <DetailField label="Địa điểm" value={booking.location || "Chưa cập nhật"} />
              <DetailField
                label="Thời gian bắt đầu"
                value={`${formatLocalDate(booking.from)} · ${formatTime(booking.from)}`}
              />
              <DetailField
                label="Thời gian kết thúc"
                value={`${formatLocalDate(booking.to)} · ${formatTime(booking.to)}`}
              />
              <DetailField label="Mã booking" value={booking.id} mono />
              <DetailField label="Ngày tạo" value={formatDateTime(booking.created_at)} />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={Package} title="Gói chụp đã đặt" />
            {packageInfo ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <PackageFact
                  label="Số ảnh bàn giao"
                  value={formatCountValue(packageInfo.photo_count, "ảnh")}
                />
                <PackageFact
                  label="Ảnh chỉnh sửa"
                  value={formatCountValue(packageInfo.retouched_photo_count, "ảnh")}
                />
                <PackageFact
                  label="Thời lượng"
                  value={formatCountValue(packageInfo.duration_minutes, "phút")}
                />
                <PackageFact
                  label="Thời gian giao ảnh"
                  value={formatCountValue(packageInfo.delivery_days, "ngày")}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Không còn thông tin gói chụp.</p>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={UsersRound} title="Khách hàng và nhiếp ảnh gia" />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ParticipantCard
                label="Khách hàng"
                name={booking.customer?.fullname ?? "Khách hàng"}
                avatar={booking.customer?.avatar_url ?? undefined}
                email={booking.customer?.email}
                phone={booking.customer?.phone_number}
              />
              <ParticipantCard
                label="Nhiếp ảnh gia"
                name={booking.photographer?.fullname ?? "Nhiếp ảnh gia"}
                avatar={booking.photographer?.avatar_url ?? undefined}
                email={booking.photographer?.email}
                phone={booking.photographer?.phone_number}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={Clock3} title="Lịch sử trạng thái" />
            {timelineQuery.isError ? (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-destructive/5 p-3 text-sm text-destructive"
              >
                Không tải được lịch sử trạng thái.
              </p>
            ) : timelineQuery.isLoading ? (
              <div className="mt-5 space-y-4">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : timelineQuery.data?.items.length ? (
              <ol className="mt-5 space-y-4">
                {timelineQuery.data.items.map((event, index) => (
                  <li key={event.id} className="relative flex gap-3">
                    {index < (timelineQuery.data?.items.length ?? 0) - 1 && (
                      <span
                        aria-hidden
                        className="absolute bottom-[-1.25rem] left-[5px] top-3 w-px bg-border"
                      />
                    )}
                    <span
                      aria-hidden
                      className="z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 border-background bg-muted-foreground"
                    />
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <StatusPill meta={BOOKING_STATUS_META[event.to_status]} />
                        <time className="text-xs tabular-nums text-muted-foreground">
                          {formatDateTime(event.created_at)}
                        </time>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Cập nhật bởi {ACTOR_LABEL[event.actor_role] ?? event.actor_role}
                      </p>
                      {event.reason && <p className="mt-1 text-sm">Lý do: {event.reason}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Chưa có lịch sử trạng thái.</p>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={Wallet} title="Tổng kết thanh toán" />
            <p className="mt-5 text-sm text-muted-foreground">Tổng giá trị booking</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatPrice(booking.total_amount)}
            </p>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-muted"
              aria-label={`Đã thanh toán ${Math.round(paidPercent)}%`}
            >
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="mt-5 divide-y divide-border">
              <MoneyRow label="Tiền cọc" value={formatPrice(booking.deposit_amount)} />
              <MoneyRow label="Đã thanh toán ròng" value={formatPrice(paidAmount)} />
              <MoneyRow
                label="Còn lại theo giá trị booking"
                value={formatPrice(remainingAmount)}
                strong
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle icon={Images} title="Ảnh bàn giao" />
            <div className="mt-5 flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Số ảnh</span>
              <span className="font-medium tabular-nums">
                {booking.gallery_photo_count.toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="mt-3 flex items-start justify-between gap-4 border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Trạng thái</span>
              <span className="text-right text-sm font-medium">
                {booking.gallery_published_at ? "Đã giao ảnh" : "Chưa giao ảnh"}
              </span>
            </div>
            {booking.gallery_published_at && (
              <p className="mt-2 text-right text-xs text-muted-foreground">
                {formatDateTime(booking.gallery_published_at)}
              </p>
            )}
          </section>
        </aside>
      </div>
    </PageContainer>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 font-semibold">
      <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      {title}
    </h2>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 break-words text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function PackageFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ParticipantCard({
  label,
  name,
  avatar,
  email,
  phone,
}: {
  label: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string | null;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border p-4">
      <p className="mb-3 text-xs text-muted-foreground">{label}</p>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-11 shrink-0">
          {avatar && <AvatarImage src={avatar} alt={name} />}
          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {email || "Chưa có email"}
          </p>
          {phone && <p className="mt-0.5 text-xs text-muted-foreground">{phone}</p>}
        </div>
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`shrink-0 text-right tabular-nums ${strong ? "font-semibold text-foreground" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? formatDate(value) : DATE_TIME_FORMAT.format(date);
}

function formatLocalDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? formatDate(value)
    : new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : TIME_FORMAT.format(date);
}

function formatCountValue(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")} ${unit}`;
}
