import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX, Search } from "lucide-react";
import { Button, Skeleton, cn } from "@lens/ui";
import { BookingCard } from "@/components/bookings/BookingCard";
import { useMyBookings } from "@/queries/useBookings";
import { BOOKING_STATUS_META } from "@/lib/booking";
import type { BookingStatus } from "@/types";

type FilterValue = "all" | BookingStatus;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: BOOKING_STATUS_META.pending.label },
  { value: "confirmed", label: BOOKING_STATUS_META.confirmed.label },
  { value: "completed", label: BOOKING_STATUS_META.completed.label },
  { value: "cancelled", label: BOOKING_STATUS_META.cancelled.label },
];

export function ClientBookings() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Lịch đặt của tôi
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading ? "Đang tải..." : `${bookings.length} buổi chụp`}
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "focus-ring rounded-full border px-3.5 py-1.5 text-sm transition-colors",
              filter === f.value
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarX className="size-6" />
          </span>
          <p className="font-medium">
            {filter === "all"
              ? "Bạn chưa có lịch đặt nào"
              : "Không có lịch đặt ở trạng thái này"}
          </p>
          {filter === "all" && (
            <Button asChild className="mt-5 rounded-full">
              <Link to="/">
                <Search className="size-4" />
                Tìm nhiếp ảnh gia
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
