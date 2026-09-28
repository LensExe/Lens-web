import { useState } from "react";
import { CalendarClock, CircleAlert, ClipboardList, Inbox } from "lucide-react";
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
    <PageContainer className="max-w-[1280px]">
      <PageHeader
        className="mx-auto mb-6 w-full max-w-6xl"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
              <CalendarClock className="size-5" />
            </span>
            <span>Quản lý đặt lịch</span>
          </span>
        }
        description="Theo dõi và xử lý toàn bộ lịch chụp của bạn."
      />

      {/* Action-needed strip — the operational "what's on me now" cue */}
      {!isLoading && needsAction && (
        <div className="mx-auto mb-6 w-full max-w-6xl rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-xs dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <CircleAlert className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Có việc cần bạn xử lý</p>
              <p className="mt-0.5 text-sm text-amber-800/80 dark:text-amber-200/80">
                Kiểm tra các yêu cầu mới và hoàn tất những buổi chụp đang chờ giao ảnh.
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-800 sm:inline-flex dark:bg-amber-500/15 dark:text-amber-200">
              {pendingCount + toDeliverCount} việc
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 pl-12 text-xs font-medium">
            {pendingCount > 0 && (
              <span className="rounded-full bg-background/70 px-2.5 py-1">
                {pendingCount} yêu cầu chờ duyệt
              </span>
            )}
            {toDeliverCount > 0 && (
              <span className="rounded-full bg-background/70 px-2.5 py-1">
                {toDeliverCount} buổi cần giao ảnh
              </span>
            )}
          </div>
        </div>
      )}

      <CollaborationInvites />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ClipboardList className="size-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Danh sách lịch chụp</h2>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Phân loại theo tiến độ xử lý
              </p>
            </div>
          </div>
          {!isLoading && (
            <span className="text-sm tabular-nums text-muted-foreground">
              {filtered.length} lịch
            </span>
          )}
        </div>

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
          <div className="grid gap-3 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-3xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-xs">
              <Inbox className="size-7" />
            </span>
            <p className="font-medium">{EMPTY_MESSAGE[group]}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Các lịch chụp mới hoặc lịch đã cập nhật sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filtered.map((booking) => (
              <RequestCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
