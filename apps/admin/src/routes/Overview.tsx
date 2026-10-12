import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, Camera, Flag, Users, Wallet } from "lucide-react";
import { PageContainer, PageHeader, Skeleton, StatCard, formatPrice } from "@lens/ui";
import { NAV_GROUPS } from "@/components/layout/nav";
import { formatDate } from "@/lib/format";
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

export function Overview() {
  const { data, isLoading, isError } = useOverviewStats();
  const { data: queue } = useAdminQueue();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useOverviewAnalytics();
  const maxBookings = Math.max(1, ...(analytics?.monthly.map((month) => month.bookings) ?? []));
  const maxRevenue = Math.max(1, ...(analytics?.monthly.map((month) => month.paid_volume_vnd) ?? []));

  return (
    <PageContainer>
      <PageHeader title="Tổng quan" description="Số liệu tổng hợp mới nhất được backend cung cấp." />
      {isError && <p role="alert" className="mb-5 rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Không tải được dashboard từ backend.</p>}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[0, 1, 2, 3, 4].map((index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}</div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} value={data.users} label="Tổng người dùng" />
          <StatCard icon={Camera} value={data.photographers} label="Nhiếp ảnh gia" />
          <StatCard icon={CalendarCheck} value={data.bookings} label="Lượt đặt lịch" />
          <StatCard icon={Flag} value={data.open_reports} label="Báo cáo đang mở" />
          <StatCard icon={Wallet} value={formatPrice(data.paid_volume_vnd)} label="Tổng thanh toán đã ghi nhận" />
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Hàng đợi cần xử lý</h2>
        {queue ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QueueCard to="/photographers" label="Hồ sơ chờ duyệt" value={queue.pendingApplications} />
            <QueueCard to="/finance" label="Yêu cầu rút tiền" value={queue.pendingWithdrawals} hint={formatPrice(queue.pendingWithdrawalTotal)} />
            <QueueCard to="/storage" label="Tài khoản vượt quota" value={queue.overQuota} />
            <QueueCard to="/users" label="Tài khoản tạm khóa" value={queue.suspendedUsers} />
          </div>
        ) : (
          <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">Không tải được hàng đợi quản trị.</p>
        )}
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Booking và thanh toán theo tháng</h2>
          <p className="mt-1 text-sm text-muted-foreground">6 tháng gần nhất · khoản thu đã ghi nhận</p>
          {analyticsError && <p role="alert" className="mt-4 text-sm text-destructive">Không tải được số liệu xu hướng.</p>}
          {analyticsLoading ? <Skeleton className="mt-5 h-48 rounded-xl" /> : analytics && analytics.monthly.length > 0 ? (
            <div className="mt-5 space-y-4">
              {analytics.monthly.map((month) => {
                const label = new Date(`${month.month}-01T00:00:00Z`).toLocaleDateString("vi-VN", { month: "short" });
                return (
                  <div key={month.month} className="grid grid-cols-[3rem_1fr] items-center gap-x-3 gap-y-1.5">
                    <span className="row-span-2 text-xs text-muted-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-1 rounded-full bg-sky-500" style={{ width: `${Math.max(1, month.bookings / maxBookings * 100)}%` }} />
                      <span className="shrink-0 text-xs tabular-nums">{month.bookings} booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 min-w-1 rounded-full bg-emerald-500" style={{ width: `${Math.max(1, month.paid_volume_vnd / maxRevenue * 100)}%` }} />
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatPrice(month.paid_volume_vnd)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !analyticsError ? <p className="mt-5 text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng thời gian này.</p> : null}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Booking theo khu vực và phong cách</h2>
          <p className="mt-1 text-sm text-muted-foreground">Trong 6 tháng gần nhất</p>
          {analyticsLoading ? <Skeleton className="mt-5 h-48 rounded-xl" /> : analytics ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <AnalyticsList title="Khu vực" rows={analytics.booking_by_location.map((row) => ({ label: row.location, value: row.bookings }))} />
              <AnalyticsList title="Phong cách" rows={analytics.booking_by_style.map((row) => ({ label: row.style, value: row.bookings }))} />
            </div>
          ) : <p className="mt-5 text-sm text-muted-foreground">Không tải được phân bố booking.</p>}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Hoạt động gần đây</h2>
        {analyticsError && <p className="mt-3 text-sm text-destructive">Không tải được hoạt động gần đây.</p>}
        {analyticsLoading ? <Skeleton className="mt-4 h-48 rounded-xl" /> : analytics?.recent_activity.length ? (
          <div className="mt-3 divide-y divide-border">
            {analytics.recent_activity.map((activity) => (
              <div key={`${activity.kind}-${activity.id}`} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{activity.kind === "report" ? "Báo cáo moderation" : "Booking mới"} · {activity.title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{activity.detail || "—"}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(activity.created_at)} · {activity.status}</span>
              </div>
            ))}
          </div>
        ) : !analyticsError ? <p className="mt-3 text-sm text-muted-foreground">Chưa có hoạt động.</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Lối tắt</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium leading-tight">{label}</p><p className="truncate text-sm text-muted-foreground">{SECTION_HINT[to]}</p></div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

function AnalyticsList({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{row.label}</span><span className="shrink-0 tabular-nums text-muted-foreground">{row.value}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>}
    </div>
  );
}

function QueueCard({ to, label, value, hint }: { to: string; label: string; value: number; hint?: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString("vi-VN")}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Link>
  );
}
