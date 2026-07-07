import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, CalendarClock, Search } from "lucide-react";
import { Button, Skeleton, cn } from "@lens/ui";
import { BookingCard } from "@/components/bookings/BookingCard";
import { useMyBookings } from "@/queries/useBookings";
import { BOOKING_STATUS_META } from "@/lib/booking";
import { currentUser } from "@/lib/session";
import type { BookingStatus } from "@/types";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Full escrow lifecycle, in the order a booking travels through it.
const STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "held",
  "released",
  "cancelled",
];

// Left-accent + dot colour per status (matches the BOOKING_STATUS_META palette).
const STATUS_ACCENT: Record<BookingStatus, { dot: string; bar: string }> = {
  pending: { dot: "bg-amber-500", bar: "border-l-amber-400 dark:border-l-amber-500/60" },
  confirmed: { dot: "bg-blue-500", bar: "border-l-blue-400 dark:border-l-blue-500/60" },
  held: { dot: "bg-violet-500", bar: "border-l-violet-400 dark:border-l-violet-500/60" },
  released: { dot: "bg-emerald-500", bar: "border-l-emerald-400 dark:border-l-emerald-500/60" },
  cancelled: { dot: "bg-muted-foreground/40", bar: "border-l-border" },
};

/** Compact stat tile — coloured left accent + dot, big number, small label.
 *  Used for the total and each booking status. */
function Tile({
  count,
  label,
  dot,
  bar,
  to,
  cta,
}: {
  count: number;
  label: string;
  dot: string;
  bar: string;
  to?: string;
  cta?: string;
}) {
  const body = (
    <>
      <span className={cn("block size-2.5 rounded-full", dot)} />
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{count}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      {cta && (
        <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{cta}</p>
      )}
    </>
  );

  const cls = cn("rounded-2xl border border-l-[3px] border-border bg-card p-4", bar);
  if (to) {
    return (
      <Link to={to} className={cn(cls, "transition-colors hover:bg-muted/40")}>
        {body}
      </Link>
    );
  }
  return <div className={cls}>{body}</div>;
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
  const countOf = (status: BookingStatus) =>
    bookings.filter((b) => b.status === status).length;

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
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Tile
            count={bookings.length}
            label="Tổng buổi chụp"
            dot="bg-foreground"
            bar="border-l-foreground/70"
          />
          {STATUS_ORDER.map((status) => {
            const count = countOf(status);
            return (
              <Tile
                key={status}
                count={count}
                label={BOOKING_STATUS_META[status].label}
                dot={STATUS_ACCENT[status].dot}
                bar={STATUS_ACCENT[status].bar}
                to={status === "confirmed" && count > 0 ? "/client/bookings" : undefined}
                cta={status === "confirmed" && count > 0 ? "Thanh toán →" : undefined}
              />
            );
          })}
        </div>
      )}

      <section className="mt-8">
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
