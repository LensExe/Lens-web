import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CameraIcon,
  CheckCircle2,
  CircleAlert,
  Clock,
  FileImage,
  ShieldAlert,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Skeleton, cn, formatPrice } from "@lens/ui";
import { StatCard } from "@/components/StatCard";
import { useOverviewStats, useRecentActivity } from "@/queries/useStats";
import { useApplications } from "@/queries/useApplications";
import { useUsers } from "@/queries/useUsers";
import { formatCount, formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/types";

const ACTIVITY_ICON: Record<ActivityItem["type"], LucideIcon> = {
  signup: UserPlus,
  booking: CalendarCheck,
  application: FileImage,
  report: CircleAlert,
};

// Action item shown in the "Cần xử lý" queue.
type ActionTone = "amber" | "rose";
const TONE: Record<ActionTone, string> = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
};

function ActionRow({
  to,
  icon: Icon,
  tone,
  title,
  desc,
  cta,
}: {
  to: string;
  icon: LucideIcon;
  tone: ActionTone;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONE[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:flex">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ShortcutCard({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

export function Overview() {
  const { data: stats, isLoading } = useOverviewStats();
  const { data: activity = [], isLoading: activityLoading } = useRecentActivity();
  const { data: applications = [] } = useApplications();
  const { data: users = [] } = useUsers();

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tổng quan</h1>
        <p className="mt-1 text-muted-foreground">
          Số liệu hệ thống, việc cần xử lý và hoạt động gần đây.
        </p>
      </header>

      {/* KPIs */}
      {isLoading || !stats ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} value={formatCount(stats.totalUsers)} label="Tổng người dùng" />
          <StatCard icon={CameraIcon} value={formatCount(stats.totalPhotographers)} label="Nhiếp ảnh gia" />
          <StatCard icon={CalendarCheck} value={formatCount(stats.totalBookings)} label="Lượt đặt lịch" />
          <StatCard icon={Wallet} value={formatPrice(stats.monthlyRevenue)} label="Doanh thu tháng" />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: action queue + management shortcuts */}
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Cần xử lý</h2>
            {pendingCount === 0 && suspendedCount === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                Không có việc nào cần xử lý. Mọi thứ đang ổn.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCount > 0 && (
                  <ActionRow
                    to="/photographers"
                    icon={Clock}
                    tone="amber"
                    title={`${pendingCount} hồ sơ nhiếp ảnh gia chờ duyệt`}
                    desc="Xem xét và phê duyệt để họ xuất hiện công khai."
                    cta="Duyệt"
                  />
                )}
                {suspendedCount > 0 && (
                  <ActionRow
                    to="/users"
                    icon={ShieldAlert}
                    tone="rose"
                    title={`${suspendedCount} tài khoản đang bị khoá`}
                    desc="Xem lại các tài khoản đã bị tạm khoá."
                    cta="Xem"
                  />
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Quản lý</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <ShortcutCard
                to="/photographers"
                icon={CameraIcon}
                title="Duyệt nhiếp ảnh gia"
                hint={pendingCount > 0 ? `${pendingCount} hồ sơ chờ duyệt` : "Không có hồ sơ chờ"}
              />
              <ShortcutCard
                to="/users"
                icon={Users}
                title="Người dùng"
                hint={stats ? `${formatCount(stats.totalUsers)} tài khoản` : "Quản lý tài khoản"}
              />
              <ShortcutCard
                to="/reports"
                icon={BarChart3}
                title="Báo cáo & thống kê"
                hint="Hiệu suất nền tảng"
              />
            </div>
          </section>
        </div>

        {/* Right: recent activity */}
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
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </span>
                      <p className="min-w-0 flex-1 text-sm">{item.text}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelative(item.at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
