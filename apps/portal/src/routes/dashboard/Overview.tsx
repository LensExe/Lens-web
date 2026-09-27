import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ImageIcon,
  Inbox,
  Package,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Button,
  PageContainer,
  Progress,
  Skeleton,
  StatCard,
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
import { BOOKING_STATUS_META } from "@/lib/booking";
import { rankProgress } from "@/lib/achievements";
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

/** Compact agenda row: date block + client + style + status. */
function AgendaItem({ booking }: { booking: Booking }) {
  const [, m, d] = booking.date.split("-");
  const status = BOOKING_STATUS_META[booking.status];
  return (
    <Link
      to={`/dashboard/bookings/${booking.id}`}
      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/60"
    >
      <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-muted leading-none">
        <span className="text-base font-semibold tabular-nums">{d}</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">Th{Number(m)}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{booking.clientName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {booking.style} · {status.label}
        </p>
      </div>
    </Link>
  );
}

export function DashboardOverview() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const { data: profile } = useMyPhotographerProfile();
  const { data: achievements } = useMyAchievements();
  const { data: earnings } = useMyEarnings();
  const today = todayISO();

  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings
    .filter((b) => b.date >= today && (b.status === "confirmed" || b.status === "held"))
    .sort((a, b) => a.date.localeCompare(b.date));
  const progress = achievements ? rankProgress(achievements.stats.completedSessions) : null;

  return (
    <PageContainer>
      <GreetingBanner
        title={`Chào, ${profile?.name ?? currentUser.name}`}
        summary={
          isLoading
            ? "Đang tải việc hôm nay…"
            : pending.length > 0
              ? `Bạn có ${pending.length} yêu cầu mới cần duyệt và ${upcoming.length} buổi chụp sắp tới.`
              : upcoming.length > 0
                ? `Không có yêu cầu nào chờ duyệt · ${upcoming.length} buổi chụp sắp tới.`
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
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Wallet}
            value={earnings ? formatPrice(earnings.thisMonth) : "—"}
            label="Thu nhập tháng này"
            delta={earnings?.changePct ?? undefined}
          />
          {pending.length > 0 ? (
            <Link to="/dashboard/bookings" className="focus-ring rounded-2xl">
              <StatCard
                icon={Inbox}
                value={pending.length}
                label="Chờ duyệt"
                interactive
                hint={<span className="font-medium text-foreground">Xử lý ngay →</span>}
              />
            </Link>
          ) : (
            <StatCard icon={Inbox} value={0} label="Chờ duyệt" />
          )}
          <StatCard icon={CalendarClock} value={upcoming.length} label="Sắp tới" />
          <StatCard
            icon={Star}
            value={profile ? profile.rating.toFixed(1) : "—"}
            label={profile ? `${profile.reviewCount} đánh giá` : "Đánh giá"}
          />
        </div>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main column: what needs a decision */}
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CalendarClock className="size-5 text-muted-foreground" />
              Yêu cầu mới cần duyệt
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
                <RequestCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}

          {/* Earnings trend */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold">Thu nhập 6 tháng gần đây</h2>
              <span className="text-xs text-muted-foreground">Sau phí sàn · tính theo tháng chụp</span>
            </div>
            {earnings ? (
              <BarChart
                data={earnings.months.map((m) => ({ label: m.label, value: m.amount }))}
                format={formatPriceCompact}
                height={180}
                ariaLabel="Thu nhập 6 tháng gần đây"
              />
            ) : (
              <Skeleton className="h-48 rounded-xl" />
            )}
          </div>

          {/* Quick management shortcuts */}
          <h2 className="mb-3 mt-8 text-lg font-semibold">Quản lý nhanh</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <ShortcutCard
              to="/dashboard/packages"
              icon={Package}
              title="Gói dịch vụ"
              hint="Thiết lập gói chụp và giá"
            />
            <ShortcutCard
              to="/dashboard/availability"
              icon={CalendarDays}
              title="Lịch làm việc"
              hint="Giờ làm hằng tuần & ngày bận"
            />
            <ShortcutCard
              to="/dashboard/portfolio"
              icon={ImageIcon}
              title="Hồ sơ năng lực"
              hint="Ảnh & giới thiệu"
            />
            <ShortcutCard
              to="/dashboard/bookings"
              icon={Inbox}
              title="Quản lý đặt lịch"
              hint="Toàn bộ lịch chụp"
            />
          </div>
        </section>

        {/* Side column: agenda + rank */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 px-2 text-sm font-semibold">Lịch chụp sắp tới</h2>
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
              <div className="space-y-0.5">
                {upcoming.slice(0, 5).map((b) => (
                  <AgendaItem key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>

          {achievements && progress && (
            <Link
              to="/dashboard/achievements"
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Cấp bậc của bạn</h2>
                <RankBadge rank={achievements.rank} />
              </div>
              {progress.next ? (
                <>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TrendingUp className="size-4" />
                    Còn {progress.remaining} buổi để lên {progress.next.name}
                  </p>
                  <Progress value={progress.pct} className="mt-2" indicatorClassName="bg-ember" />
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Bạn đã đạt cấp bậc cao nhất.
                </p>
              )}
            </Link>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
