import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CalendarCheck, CalendarClock, CameraIcon, Search } from "lucide-react";
import { Button, Skeleton } from "@lens/ui";
import { BookingCard } from "@/components/bookings/BookingCard";
import { useMyBookings } from "@/queries/useBookings";
import { currentUser } from "@/lib/session";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function StatCard({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
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

export function ClientOverview() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const today = todayISO();
  const upcoming = bookings.filter(
    (b) =>
      b.date >= today &&
      (b.status === "pending" ||
        b.status === "confirmed" ||
        b.status === "held")
  );
  const completed = bookings.filter((b) => b.status === "released");

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Chào, {currentUser.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý các buổi chụp và khám phá nhiếp ảnh gia mới.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <StatCard icon={CameraIcon} value={bookings.length} label="Tổng buổi chụp" />
          <StatCard icon={CalendarClock} value={upcoming.length} label="Sắp tới" />
          <StatCard icon={CalendarCheck} value={completed.length} label="Đã hoàn thành" />
        </div>
      )}

      <section className="mt-9">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarClock className="size-5 text-muted-foreground" />
            Buổi chụp sắp tới
          </h2>
          <Link
            to="/client/bookings"
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Tất cả
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-8 text-center">
            <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CalendarCheck className="size-6" />
            </span>
            <p className="font-medium">Chưa có buổi chụp nào sắp tới</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Tìm nhiếp ảnh gia phù hợp và đặt lịch cho khoảnh khắc của bạn.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/">
                <Search className="size-4" />
                Tìm nhiếp ảnh gia
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
