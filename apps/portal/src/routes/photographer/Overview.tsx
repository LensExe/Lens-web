import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ImageIcon,
  Inbox,
  Lightbulb,
  Package,
  Star,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Button,
  PageContainer,
  Skeleton,
  formatPrice,
  formatPriceCompact,
} from "@lens/ui";
import { GreetingBanner } from "@/components/workspace/GreetingBanner";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { RankBadge } from "@/components/achievements/RankBadge";
import {
  useIncomingBookings,
  useMyEarnings,
  useMyPhotographerProfile,
} from "@/queries/useDashboard";
import { useMyAchievements } from "@/queries/useAchievements";
import { bookingStatusMeta } from "@/lib/booking";
import { addMinutesToTime } from "@/lib/schedule";
import { currentUser } from "@/lib/session";
import type { Booking } from "@/types";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
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

function OverviewMetric({
  icon: Icon,
  label,
  value,
  hint,
  delta,
  tone = "neutral",
  interactive = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: number;
  tone?: "neutral" | "ember" | "blue" | "amber";
  interactive?: boolean;
}) {
  const iconTone = {
    neutral: "bg-muted text-muted-foreground",
    ember: "bg-ember/10 text-ember",
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  }[tone];

  return (
    <div
      className={`h-full rounded-2xl border border-border bg-card p-4 shadow-xs ${interactive ? "transition-colors hover:bg-muted/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          {delta !== undefined && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums ${delta >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"}`}
            >
              {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(0)}%
            </span>
          )}
        </div>
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
          <Icon className="size-3.5" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold leading-none tracking-tight tabular-nums">{value}</p>
      {hint && <div className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Compact agenda row: date block + client + style + status. */
function AgendaItem({ booking }: { booking: Booking }) {
  const [, m, d] = booking.date.split("-");
  const status = bookingStatusMeta(booking);
  const endTime = booking.timeSlot
    ? addMinutesToTime(
        booking.timeSlot,
        Math.round((booking.packageSnapshot?.durationHours ?? 2) * 60),
      )
    : null;
  return (
    <Link
      to={`/dashboard/bookings/${booking.id}`}
      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60"
    >
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-muted leading-none">
        <span className="text-base font-semibold tabular-nums">{d}</span>
        <span className="mt-1 text-[9px] uppercase text-muted-foreground">Th{Number(m)}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold">{booking.clientName}</p>
          <span className="shrink-0 text-[9px] text-muted-foreground">{status.label}</span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {booking.style}
          {booking.timeSlot ? ` · ${booking.timeSlot}${endTime ? `–${endTime}` : ""}` : ""}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">{booking.location}</p>
      </div>
    </Link>
  );
}

export function PhotographerOverview() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const { data: profile } = useMyPhotographerProfile();
  const { data: achievements } = useMyAchievements();
  const { data: earnings } = useMyEarnings();
  const today = todayISO();
  const sevenDays = new Date();
  sevenDays.setHours(0, 0, 0, 0);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const sevenDaysISO = `${sevenDays.getFullYear()}-${String(sevenDays.getMonth() + 1).padStart(2, "0")}-${String(sevenDays.getDate()).padStart(2, "0")}`;

  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings
    .filter((b) => b.date >= today && (b.status === "confirmed" || b.status === "held"))
    .sort(
      (a, b) => a.date.localeCompare(b.date) || (a.timeSlot ?? "").localeCompare(b.timeSlot ?? ""),
    );
  const upcomingThisWeek = upcoming.filter((booking) => booking.date <= sevenDaysISO);

  return (
    <PageContainer>
      <GreetingBanner
        title={`Chào, ${profile?.name ?? currentUser.name} 👋`}
        summary={
          isLoading
            ? "Đang tải việc hôm nay…"
            : pending.length > 0
              ? `Bạn có ${pending.length} yêu cầu mới cần duyệt và ${upcomingThisWeek.length} buổi chụp trong 7 ngày tới.`
              : upcomingThisWeek.length > 0
                ? `Không có yêu cầu nào chờ duyệt · ${upcomingThisWeek.length} buổi chụp trong 7 ngày tới.`
                : "Chưa có việc cần xử lý. Mở thêm khung giờ để nhận thêm khách."
        }
        action={
          pending.length > 0 ? (
            <Button asChild className="rounded-full bg-ember text-white hover:bg-ember/90">
              <Link to="/dashboard/bookings">
                Duyệt yêu cầu
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="rounded-full bg-card">
              <Link to="/dashboard/availability">
                <CalendarDays className="size-4" />
                Cập nhật lịch làm việc
              </Link>
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewMetric
            icon={Wallet}
            value={earnings ? formatPrice(earnings.thisMonth) : "—"}
            label="Thu nhập tháng này"
            delta={earnings?.changePct ?? undefined}
            hint={
              earnings ? (
                <>Tháng trước: {formatPrice(earnings.lastMonth)}</>
              ) : (
                "Backend chưa có API báo cáo doanh thu"
              )
            }
          />
          {pending.length > 0 ? (
            <Link to="/dashboard/bookings" className="focus-ring rounded-2xl">
              <OverviewMetric
                icon={Inbox}
                value={pending.length}
                label="Chờ duyệt"
                tone="ember"
                interactive
                hint={<span className="font-medium text-ember">Xử lý ngay →</span>}
              />
            </Link>
          ) : (
            <OverviewMetric icon={Inbox} value={0} label="Chờ duyệt" tone="ember" />
          )}
          <OverviewMetric
            icon={CalendarClock}
            value={upcomingThisWeek.length}
            label="Buổi chụp sắp tới"
            hint="Trong 7 ngày kế tiếp"
            tone="blue"
          />
          <OverviewMetric
            icon={Star}
            value={
              profile ? (
                <span className="inline-flex flex-wrap items-center gap-x-1.5">
                  {profile.rating.toFixed(1)}
                  <span
                    className="text-[10px] tracking-tight text-amber-500"
                    aria-label="thang điểm 5 sao"
                  >
                    ★★★★★
                  </span>
                </span>
              ) : (
                "—"
              )
            }
            label={profile ? `${profile.reviewCount} đánh giá` : "Đánh giá"}
            tone="amber"
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px] xl:gap-5">
        {/* Main column: what needs a decision */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <span className="size-2 rounded-full bg-ember" />
              Yêu cầu mới cần duyệt
              {pending.length > 0 && (
                <span className="rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-semibold text-ember">
                  {pending.length}
                </span>
              )}
            </h2>
            <Link
              to="/dashboard/bookings"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Tất cả
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          ) : pending.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
              <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-6" />
              </span>
              <p className="font-medium">Không có yêu cầu nào đang chờ</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Các yêu cầu đặt lịch mới từ khách hàng sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 3).map((booking) => (
                <RequestCard key={booking.id} booking={booking} variant="bookingGrid" />
              ))}
            </div>
          )}

          {/* Earnings trend */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold">Thu nhập 6 tháng gần đây</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Sau phí sàn · tính theo tháng chụp
                </p>
              </div>
              {earnings && (
                <span className="text-xs text-muted-foreground">
                  Tháng này <b className="text-foreground">{formatPrice(earnings.thisMonth)}</b>
                </span>
              )}
            </div>
            {earnings ? (
              <BarChart
                data={earnings.months.map((m) => ({ label: m.label, value: m.amount }))}
                format={formatPriceCompact}
                height={180}
                ariaLabel="Thu nhập 6 tháng gần đây"
              />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
                Chưa có endpoint tổng hợp doanh thu theo tháng.
              </div>
            )}
          </div>
        </section>

        {/* Side column: agenda + rank */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold">Lịch chụp sắp tới</h2>
              <Link
                to="/dashboard/bookings"
                className="text-[10px] font-medium text-ember hover:underline"
              >
                Xem tất cả
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-11 rounded-xl" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            ) : upcoming.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">
                Chưa có buổi chụp nào đã chốt lịch.
              </p>
            ) : (
              <div className="divide-y divide-border/70">
                {upcoming.slice(0, 3).map((b) => (
                  <AgendaItem key={b.id} booking={b} />
                ))}
              </div>
            )}
            <Button asChild variant="outline" size="sm" className="mt-2 w-full rounded-xl text-xs">
              <Link to="/dashboard/availability">
                <CalendarDays className="size-3.5" /> Cập nhật lịch làm việc
              </Link>
            </Button>
          </div>

          {achievements && (
            <Link
              to="/dashboard/achievements"
              className="block rounded-2xl border border-border bg-card p-4 shadow-xs transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Cấp bậc của bạn</h2>
                <RankBadge rank={achievements.rank} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Hoa hồng hiện tại:{" "}
                <b className="text-foreground">{Math.round(achievements.commissionRate * 100)}%</b>.
                Backend chưa trả số booking hoàn thành để tính tiến độ lên cấp.
              </p>
            </Link>
          )}

          <div className="rounded-2xl border border-orange-200/80 bg-orange-50/70 p-4 dark:border-orange-900/60 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Lightbulb className="size-4" />
              </span>
              <div>
                <h2 className="text-xs font-semibold">Mẹo tăng thu nhập</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Mở thêm những khung giờ bạn sẵn sàng chụp để khách có thêm lựa chọn đặt lịch.
                </p>
                <Link
                  to="/dashboard/availability"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 hover:underline dark:text-orange-300"
                >
                  Cập nhật lịch làm việc <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quản lý nhanh
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ShortcutCard
            to="/dashboard/packages"
            icon={Package}
            title="Gói dịch vụ"
            hint="Thiết lập gói chụp & giá"
          />
          <ShortcutCard
            to="/dashboard/availability"
            icon={CalendarDays}
            title="Lịch làm việc"
            hint="Booking và khoảng giờ bận"
          />
          <ShortcutCard
            to="/dashboard/portfolio"
            icon={ImageIcon}
            title="Hồ sơ năng lực"
            hint="Ảnh tác phẩm & giới thiệu"
          />
          <ShortcutCard
            to="/dashboard/bookings"
            icon={Inbox}
            title="Quản lý đặt lịch"
            hint="Tiến độ & giao sản phẩm"
          />
        </div>
      </section>
    </PageContainer>
  );
}
