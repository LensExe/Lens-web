import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Camera, Flag, Users, Wallet } from "lucide-react";
import {
  BarList,
  PageContainer,
  PageHeader,
  Skeleton,
  StatCard,
  formatPrice,
  formatPriceCompact,
} from "@lens/ui";
import { NAV_GROUPS } from "@/components/layout/nav";
import { formatCount, formatDate } from "@/lib/format";
import { useAdminQueue, useOverviewAnalytics, useOverviewStats } from "@/queries/useStats";

const SECTION_HINT: Record<string, string> = {
  "/photographers": "Hồ sơ nhiếp ảnh gia chờ duyệt",
  "/users": "Tài khoản trên nền tảng",
  "/bookings": "Lịch đặt và trạng thái thực tế",
  "/finance": "Yêu cầu rút tiền và hoàn tiền",
  "/storage": "Dung lượng và quota của nhiếp ảnh gia",
  "/quality": "Cấu hình hạng và huy hiệu",
  "/reports": "Báo cáo moderation",
};

const SECTIONS = NAV_GROUPS.flatMap((group) => group.items).filter((item) => item.to !== "/");

const STYLE_LABELS: Record<string, string> = {
  portrait: "Chân dung",
  vintage: "Cổ điển",
  korean: "Hàn Quốc",
  wedding: "Cưới",
  concept: "Ý tưởng",
  "pre-wedding": "Tiền cưới",
  beach: "Biển",
  lifestyle: "Đời thường",
  event: "Sự kiện",
  corporate: "Doanh nghiệp",
  family: "Gia đình",
  outdoor: "Ngoài trời",
  kids: "Trẻ em",
  streetwear: "Thời trang đường phố",
  fashion: "Thời trang",
  film: "Ảnh film",
  maternity: "Mẹ bầu",
  commercial: "Thương mại",
};

const REPORT_TARGET_LABELS: Record<string, string> = {
  user: "tài khoản",
  booking: "lịch đặt",
  photographer: "nhiếp ảnh gia",
  portfolio: "album ảnh",
  feedback: "đánh giá",
};

const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  accepted: "Đã xác nhận",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  in_progress: "Đang thực hiện",
  shot: "Đã chụp",
  completed: "Hoàn tất",
  open: "Đang mở",
  resolved: "Đã xử lý",
  escalated: "Đã chuyển cấp",
};

const ACTIVITY_DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function Overview() {
  const { data, isLoading, isError } = useOverviewStats();
  const { data: queue } = useAdminQueue();
  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
  } = useOverviewAnalytics();
  const maxBookings = Math.max(1, ...(analytics?.monthly.map((month) => month.bookings) ?? []));
  const maxRevenue = Math.max(
    1,
    ...(analytics?.monthly.map((month) => month.paid_volume_vnd) ?? []),
  );

  return (
    <PageContainer>
      <PageHeader
        title="Tổng quan"
        description="Số liệu tổng hợp mới nhất được backend cung cấp."
      />
      {isError && (
        <p
          role="alert"
          className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          Không tải được dashboard từ backend.
        </p>
      )}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} value={data.users} label="Tổng người dùng" />
          <StatCard icon={Camera} value={data.photographers} label="Nhiếp ảnh gia" />
          <StatCard icon={CalendarCheck} value={data.bookings} label="Lượt đặt lịch" />
          <StatCard icon={Flag} value={data.open_reports} label="Báo cáo đang mở" />
          <StatCard
            icon={Wallet}
            value={formatPrice(data.paid_volume_vnd)}
            label="Tổng thanh toán đã ghi nhận"
          />
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Hàng đợi cần xử lý</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Các mục đang chờ đội ngũ quản trị xem lại.
          </p>
        </div>
        {queue ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QueueCard
              to="/photographers"
              label="Hồ sơ chờ duyệt"
              value={queue.pendingApplications}
            />
            <QueueCard
              to="/finance"
              label="Yêu cầu rút tiền"
              value={queue.pendingWithdrawals}
              hint={formatPrice(queue.pendingWithdrawalTotal)}
            />
            <QueueCard to="/storage" label="Tài khoản vượt quota" value={queue.overQuota} />
            <QueueCard to="/users" label="Tài khoản tạm khóa" value={queue.suspendedUsers} />
          </div>
        ) : (
          <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Không tải được hàng đợi quản trị.
          </p>
        )}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Lượt đặt và thanh toán theo tháng</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                6 tháng gần nhất · tiền cọc và thanh toán đã ghi nhận
              </p>
            </div>
          </div>
          {analyticsError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-destructive/5 p-3 text-sm text-destructive"
            >
              Không tải được số liệu xu hướng.
            </p>
          )}
          {analyticsLoading ? (
            <Skeleton className="mt-5 h-48 rounded-xl" />
          ) : analytics && analytics.monthly.length > 0 ? (
            <div className="mt-6 space-y-5">
              {analytics.monthly.map((month) => {
                const label = new Date(`${month.month}-01T00:00:00Z`).toLocaleDateString("vi-VN", {
                  month: "short",
                  timeZone: "UTC",
                });
                return (
                  <div
                    key={month.month}
                    className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5"
                  >
                    <span className="row-span-2 text-xs font-medium capitalize text-muted-foreground">
                      {label}
                    </span>
                    <MonthlyMetricBar
                      label={`${formatCount(month.bookings)} lượt đặt`}
                      value={month.bookings}
                      max={maxBookings}
                      color="bg-chart-2"
                    />
                    <MonthlyMetricBar
                      label={`${formatPriceCompact(month.paid_volume_vnd)} ₫`}
                      value={month.paid_volume_vnd}
                      max={maxRevenue}
                      color="bg-chart-3"
                    />
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-chart-2" />
                  Lượt đặt
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-chart-3" />
                  Tiền cọc và thanh toán
                </span>
              </div>
            </div>
          ) : !analyticsError ? (
            <p className="mt-5 rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu trong khoảng thời gian này.
            </p>
          ) : null}
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Lượt đặt theo khu vực và phong cách</h2>
            <p className="mt-1 text-sm text-muted-foreground">Trong 6 tháng gần nhất</p>
          </div>
          {analyticsError ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-destructive/5 p-3 text-sm text-destructive"
            >
              Không tải được phân bố lượt đặt.
            </p>
          ) : analyticsLoading ? (
            <Skeleton className="mt-5 h-48 rounded-xl" />
          ) : analytics ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <AnalyticsList
                title="Khu vực"
                rows={analytics.booking_by_location.map((row) => ({
                  label: row.location,
                  value: row.bookings,
                }))}
              />
              <AnalyticsList
                title="Phong cách"
                rows={analytics.booking_by_style.map((row) => ({
                  label: STYLE_LABELS[row.style] ?? row.style,
                  value: row.bookings,
                }))}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Không tải được phân bố lượt đặt.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-semibold">Hoạt động gần đây</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Các lịch đặt và báo cáo mới phát sinh.
            </p>
          </div>
        </div>
        {analyticsError && (
          <p role="alert" className="mt-4 rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
            Không tải được hoạt động gần đây.
          </p>
        )}
        {analyticsLoading ? (
          <Skeleton className="mt-4 h-48 rounded-xl" />
        ) : analytics?.recent_activity.length ? (
          <div className="mt-4 divide-y divide-border">
            {analytics.recent_activity.map((activity) => (
              <div
                key={`${activity.kind}-${activity.id}`}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    {activity.kind === "report" ? (
                      <Flag className="size-4" />
                    ) : (
                      <CalendarCheck className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {activity.kind === "report" ? "Báo cáo kiểm duyệt" : "Lịch đặt mới"}
                      <span className="text-muted-foreground"> · </span>
                      {activity.kind === "report"
                        ? (REPORT_TARGET_LABELS[activity.title] ?? activity.title)
                        : activity.title}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {activity.detail || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 pl-12 sm:justify-end sm:pl-0">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {formatActivityDate(activity.created_at)}
                  </span>
                  <span className="rounded-xl border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground">
                    {ACTIVITY_STATUS_LABELS[activity.status] ?? activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : !analyticsError ? (
          <p className="mt-4 rounded-xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có hoạt động.
          </p>
        ) : null}
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Lối tắt quản trị</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Đi nhanh đến các khu vực quản lý thường dùng.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium leading-tight">{label}</p>
                <p className="truncate text-sm text-muted-foreground">{SECTION_HINT[to]}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? formatDate(value) : ACTIVITY_DATE_FORMAT.format(date);
}

function AnalyticsList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {rows.length ? (
        <BarList items={rows} format={formatCount} />
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>
      )}
    </div>
  );
}

function MonthlyMetricBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = value > 0 ? Math.max(2, (value / max) * 100) : 0;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_7.25rem] items-center gap-2">
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span
        className="truncate text-right text-xs tabular-nums text-muted-foreground"
        title={label}
      >
        {label}
      </span>
    </div>
  );
}

function QueueCard({
  to,
  label,
  value,
  hint,
}: {
  to: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCount(value)}</p>
        {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
