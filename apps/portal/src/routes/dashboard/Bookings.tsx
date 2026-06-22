import { useState } from "react";
import { Inbox } from "lucide-react";
import { Skeleton, cn } from "@lens/ui";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { useIncomingBookings } from "@/queries/useDashboard";
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

export function DashboardBookings() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Yêu cầu đặt lịch
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading
            ? "Đang tải..."
            : pendingCount > 0
              ? `${pendingCount} yêu cầu đang chờ bạn duyệt`
              : "Không có yêu cầu nào đang chờ"}
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
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-6" />
          </span>
          <p className="font-medium">
            {filter === "all"
              ? "Chưa có yêu cầu đặt lịch nào"
              : "Không có yêu cầu ở trạng thái này"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <RequestCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
