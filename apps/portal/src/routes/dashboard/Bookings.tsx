import { useState } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { Skeleton, cn } from "@lens/ui";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { CollaborationInvites } from "@/components/dashboard/CollaborationInvites";
import { useIncomingBookings } from "@/queries/useDashboard";
import type { BookingStatus } from "@/types";

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

export function DashboardBookings() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const [group, setGroup] = useState<GroupKey>("pending");

  const countFor = (statuses: BookingStatus[]) =>
    bookings.filter((b) => statuses.includes(b.status)).length;
  const active = GROUPS.find((g) => g.key === group)!;
  const filtered = bookings.filter((b) => active.statuses.includes(b.status));

  // Action-oriented counts — what needs the photographer's hands right now.
  // (Kept operational, distinct from the business KPIs on the dashboard home.)
  const pendingCount = countFor(["pending"]);
  const toDeliverCount = countFor(["held"]);
  const needsAction = pendingCount > 0 || toDeliverCount > 0;

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

      {/* Action-needed strip — the operational "what's on me now" cue */}
      {!isLoading && needsAction && (
        <div className="mb-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
          <CircleAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-medium">Cần xử lý:</span>
          {pendingCount > 0 && <span>{pendingCount} yêu cầu chờ duyệt</span>}
          {pendingCount > 0 && toDeliverCount > 0 && (
            <span className="text-amber-400 dark:text-amber-500/60">·</span>
          )}
          {toDeliverCount > 0 && <span>{toDeliverCount} buổi cần giao ảnh</span>}
        </div>
      )}

      <CollaborationInvites />

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
