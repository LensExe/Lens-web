import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CalendarCheck,
  Camera,
  CheckCircle2,
  CircleAlert,
  FileImage,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  PageContainer,
  PageHeader,
  Skeleton,
  StatCard,
  formatPrice,
  formatPriceCompact,
} from "@lens/ui";
import { NAV_GROUPS } from "@/components/layout/nav";
import { useAdminQueue, useOverviewStats, useRecentActivity } from "@/queries/useStats";
import { useReports } from "@/queries/useReports";
import { formatCount, formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/types";

// Icons tell the activity types apart; colour stays neutral (DESIGN.md).
const ACTIVITY_ICON: Record<ActivityItem["type"], LucideIcon> = {
  signup: UserPlus,
  booking: CalendarCheck,
  application: FileImage,
  report: CircleAlert,
  withdrawal: Wallet,
};
const SECTION_HINT: Record<string, string> = {
  "/photographers": "Hồ sơ mới & portfolio",
  "/users": "Khoá / mở khoá tài khoản",
  "/bookings": "Tiền sàn giữ & ghép thợ",
  "/finance": "Duyệt rút tiền",
  "/storage": "Dung lượng & quota",
  "/quality": "Hạng, hoa hồng, AI",
  "/reports": "Doanh thu & xu hướng",
};
const SECTIONS = NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.to !== "/");

function TaskRow({
  to,
  icon: Icon,
  urgent,
  title,
  desc,
  cta,
}: {
  to: string;
  icon: LucideIcon;
  /** A problem, not just a to-do — marked with a small red dot. */
  urgent?: boolean;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="size-5" />
        {urgent && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-card" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{desc}</p>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:flex">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function Overview() {
  const { data: stats, isLoading } = useOverviewStats();
  const { data: queue } = useAdminQueue();
  const { data: reports } = useReports();
  const { data: activity = [], isLoading: activityLoading } = useRecentActivity();

  const tasks = queue
    ? [
        queue.pendingApplications > 0 && {
          to: "/photographers",
          icon: FileImage,
          title: `${queue.pendingApplications} hồ sơ nhiếp ảnh gia chờ duyệt`,
          desc: "Xem portfolio và phê duyệt để họ xuất hiện công khai.",
          cta: "Duyệt",
        },
        queue.pendingWithdrawals > 0 && {
          to: "/finance",
          icon: Wallet,
          title: `${queue.pendingWithdrawals} yêu cầu rút tiền · ${formatPrice(queue.pendingWithdrawalTotal)}`,
          desc: "Nhiếp ảnh gia đang chờ nhận tiền về ngân hàng.",
          cta: "Xử lý",
        },
        queue.overQuota > 0 && {
          to: "/storage",
          icon: AlertTriangle,
          urgent: true,
          title: `${queue.overQuota} tài khoản vượt dung lượng`,
          desc: "Bộ sưu tập của họ đang bị khoá cho tới khi nâng cấp gói.",
          cta: "Xem",
        },
        queue.suspendedUsers > 0 && {
          to: "/users",
          icon: Ban,
          title: `${queue.suspendedUsers} tài khoản đang bị khoá`,
          desc: "Xem lại và mở khoá nếu đã xử lý xong.",
          cta: "Xem",
        },
      ].filter((t) => !!t)
    : [];

  return (
    <PageContainer>
      <PageHeader title="Tổng quan" description="Số liệu hệ thống, việc cần xử lý và hoạt động gần đây." />

      {/* KPIs */}
      {isLoading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} value={formatCount(stats.totalUsers)} label="Tổng người dùng" delta={stats.change.users} />
          <StatCard icon={Camera} value={formatCount(stats.totalPhotographers)} label="Nhiếp ảnh gia" delta={stats.change.photographers} />
          <StatCard icon={CalendarCheck} value={formatCount(stats.totalBookings)} label="Lượt đặt lịch" delta={stats.change.bookings} />
          <StatCard icon={Wallet} value={formatPrice(stats.monthlyRevenue)} label="Doanh thu tháng này" delta={stats.change.revenue} />
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Cần xử lý</h2>
            {!queue ? (
              <Skeleton className="h-20 rounded-2xl" />
            ) : tasks.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                Không có việc nào cần xử lý. Mọi thứ đang ổn.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((t) => (
                  <TaskRow key={t.to} {...t} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">Doanh thu 6 tháng</h2>
              <Link to="/reports" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                Báo cáo chi tiết
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {reports ? (
              <BarChart
                data={reports.monthly.map((m) => ({ label: m.month, value: m.revenue }))}
                format={formatPriceCompact}
                height={190}
                ariaLabel="Doanh thu 6 tháng"
              />
            ) : (
              <Skeleton className="h-52 rounded-xl" />
            )}
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Hoạt động gần đây</h2>
          <div className="rounded-2xl border border-border bg-card">
            {activityLoading ? (
              <div className="space-y-4 p-5">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.type];
                  return (
                    <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                        <Icon className="size-4" />
                      </span>
                      <p className="min-w-0 flex-1 text-sm">{item.text}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(item.at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Lối tắt</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
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
