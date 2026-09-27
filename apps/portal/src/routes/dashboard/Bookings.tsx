import { useState } from "react";
import { CircleAlert, Inbox } from "lucide-react";
import { Skeleton, PageContainer, PageHeader, StatusTabs } from "@lens/ui";
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
    <PageContainer>
      <PageHeader
        title="Quản lý đặt lịch"
        description="Theo dõi và xử lý toàn bộ lịch chụp của bạn."
      />

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
      <StatusTabs
        className="mb-6"
        value={group}
        onChange={setGroup}
        tabs={GROUPS.map((g) => ({
          value: g.key,
          label: g.label,
          count: isLoading ? undefined : countFor(g.statuses),
        }))}
      />

      {isLoading ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-7" />
          </span>
          <p className="font-medium">{EMPTY_MESSAGE[group]}</p>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((booking) => (
            <RequestCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
