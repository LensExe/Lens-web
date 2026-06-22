import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CameraIcon,
  CircleAlert,
  Clock,
  FileImage,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Skeleton, formatPrice } from "@lens/ui";
import { StatCard } from "@/components/StatCard";
import { useOverviewStats, useRecentActivity } from "@/queries/useStats";
import { useApplications } from "@/queries/useApplications";
import { formatCount, formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/types";

const ACTIVITY_ICON: Record<ActivityItem["type"], typeof UserPlus> = {
  signup: UserPlus,
  booking: CalendarCheck,
  application: FileImage,
  report: CircleAlert,
};

export function Overview() {
  const { data: stats, isLoading } = useOverviewStats();
  const { data: activity = [], isLoading: activityLoading } = useRecentActivity();
  const { data: applications = [] } = useApplications();

  const pending = applications.filter((a) => a.status === "pending");

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Tổng quan</h1>
        <p className="mt-1 text-muted-foreground">
          Số liệu hệ thống và hoạt động gần đây trên nền tảng Lens.
        </p>
      </header>

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

      {/* Pending approvals callout */}
      {pending.length > 0 && (
        <Link
          to="/photographers"
          className="group mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Clock className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {pending.length} hồ sơ nhiếp ảnh gia chờ duyệt
            </p>
            <p className="text-sm text-muted-foreground">
              Xem xét và phê duyệt để họ xuất hiện công khai.
            </p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
        </Link>
      )}

      {/* Recent activity */}
      <section className="mt-8">
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
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="size-4" />
                    </span>
                    <p className="min-w-0 flex-1 truncate text-sm">{item.text}</p>
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
  );
}
