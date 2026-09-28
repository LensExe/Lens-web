import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX, Search } from "lucide-react";
import { Button, Skeleton, PageContainer, PageHeader, StatusTabs } from "@lens/ui";
import { BookingCard } from "@/components/bookings/BookingCard";
import { useMyBookings } from "@/queries/useBookings";
import { BOOKING_STATUS_META } from "@/lib/booking";
import type { BookingStatus } from "@/types";

type FilterValue = "all" | BookingStatus;

// Status tabs, in the order a booking travels through them.
const FILTERS: FilterValue[] = [
  "all",
  "awaiting_deposit",
  "pending",
  "confirmed",
  "held",
  "released",
  "cancelled",
];

export function ClientBookings() {
  const { data: bookings = [], isLoading } = useMyBookings();
  const [filter, setFilter] = useState<FilterValue>("all");

  const countOf = (value: FilterValue) =>
    value === "all" ? bookings.length : bookings.filter((b) => b.status === value).length;
  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <PageContainer>
      <PageHeader
        title="Lịch đặt của tôi"
        description={isLoading ? "Đang tải..." : `${bookings.length} buổi chụp`}
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/">
              <Search className="size-4" />
              Đặt lịch mới
            </Link>
          </Button>
        }
      />

      <StatusTabs
        className="mb-6"
        value={filter}
        onChange={setFilter}
        tabs={FILTERS.map((value) => ({
          value,
          label: value === "all" ? "Tất cả" : BOOKING_STATUS_META[value].label,
          count: isLoading ? undefined : countOf(value),
        }))}
      />

      {isLoading ? (
        <div className="mx-auto max-w-5xl space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarX className="size-7" />
          </span>
          <p className="font-medium">
            {filter === "all" ? "Bạn chưa có lịch đặt nào" : "Không có buổi chụp phù hợp"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {filter === "all"
              ? "Tìm nhiếp ảnh gia phù hợp và đặt lịch cho khoảnh khắc của bạn."
              : "Chưa có buổi chụp nào ở trạng thái này."}
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
        <div className="mx-auto max-w-5xl space-y-3">
          {filtered.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
