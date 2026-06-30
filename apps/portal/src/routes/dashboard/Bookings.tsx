import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, CalendarClock, Inbox, Wallet } from "lucide-react";
import { Skeleton, cn, formatPrice } from "@lens/ui";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { useIncomingBookings } from "@/queries/useDashboard";
import { photographerPayout } from "@/lib/booking";
import type { Booking, BookingStatus } from "@/types";

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Group the escrow lifecycle into the stages a photographer works in.
type GroupKey = "pending" | "active" | "done" | "cancelled";

const GROUPS: { key: GroupKey; label: string; statuses: BookingStatus[] }[] = [
  { key: "pending", label: "Cần duyệt", statuses: ["pending"] },
  { key: "active", label: "Đang diễn ra", statuses: ["confirmed", "held"] },
  { key: "done", label: "Hoàn thành", statuses: ["released"] },
  { key: "cancelled", label: "Đã huỷ", statuses: ["cancelled"] },
];

const EMPTY_MESSAGE: Record<GroupKey, string> = {
  pending: "Không có yêu cầu nào cần duyệt",
  active: "Chưa có buổi chụp nào đang diễn ra",
  done: "Chưa có buổi chụp nào hoàn thành",
  cancelled: "Không có yêu cầu nào đã huỷ",
};

function SummaryStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function DashboardBookings() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const [group, setGroup] = useState<GroupKey>("pending");
  const today = todayISO();

  const countFor = (statuses: BookingStatus[]) =>
    bookings.filter((b) => statuses.includes(b.status)).length;
  const active = GROUPS.find((g) => g.key === group)!;
  const filtered = bookings.filter((b) => active.statuses.includes(b.status));

  const pendingCount = countFor(["pending"]);
  const upcomingCount = bookings.filter(
    (b) => b.date >= today && (b.status === "confirmed" || b.status === "held")
  ).length;
  const doneBookings = bookings.filter((b) => b.status === "released");
  const revenue = doneBookings.reduce(
    (sum, b: Booking) => sum + photographerPayout(b.price),
    0
  );

  return (
    <div className="mx-auto max-w-[860px] px-5 py-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Quản lý đặt lịch
        </h1>
        <p className="mt-1 text-muted-foreground">
          Theo dõi và xử lý toàn bộ lịch chụp của bạn.
        </p>
      </header>

      {/* Summary strip */}
      {isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat icon={Inbox} value={String(pendingCount)} label="Chờ duyệt" />
          <SummaryStat icon={CalendarClock} value={String(upcomingCount)} label="Sắp tới" />
          <SummaryStat icon={CalendarCheck} value={String(doneBookings.length)} label="Hoàn thành" />
          <SummaryStat icon={Wallet} value={formatPrice(revenue)} label="Doanh thu" />
        </div>
      )}

      {/* Stage tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const count = countFor(g.statuses);
          const selected = group === g.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              aria-pressed={selected}
              className={cn(
                "focus-ring flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {g.label}
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center text-xs font-medium tabular-nums",
                  selected
                    ? "bg-background/20 text-background"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
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
          <p className="font-medium">{EMPTY_MESSAGE[group]}</p>
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
