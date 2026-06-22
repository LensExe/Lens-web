import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarCheck, CalendarClock, Inbox, Star, Wallet } from "lucide-react";
import { Skeleton, formatPrice } from "@lens/ui";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { useIncomingBookings, useMyPhotographerProfile } from "@/queries/useDashboard";
import { currentUser } from "@/lib/session";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4.5" />
      </span>
      <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function DashboardOverview() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const { data: profile } = useMyPhotographerProfile();
  const today = todayISO();

  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter(
    (b) => b.date >= today && b.status === "confirmed"
  );
  const completed = bookings.filter((b) => b.status === "completed");
  const revenue = completed.reduce((sum, b) => sum + b.price, 0);

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Chào, {currentUser.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý yêu cầu đặt lịch, hồ sơ và lịch trống của bạn.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Inbox} value={String(pending.length)} label="Chờ duyệt" />
          <StatCard icon={CalendarClock} value={String(upcoming.length)} label="Sắp tới" />
          <StatCard icon={CalendarCheck} value={String(completed.length)} label="Đã hoàn thành" />
          <StatCard icon={Wallet} value={formatPrice(revenue)} label="Doanh thu" />
        </div>
      )}

      {profile && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/30 px-5 py-3 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span className="font-medium">{profile.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            · {profile.reviewCount} đánh giá
          </span>
        </div>
      )}

      <section className="mt-9">
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
      </section>
    </div>
  );
}
