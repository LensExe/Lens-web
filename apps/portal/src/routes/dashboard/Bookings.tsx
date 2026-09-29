import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Filter,
  ImageUp,
  Inbox,
  Plus,
  Search,
} from "lucide-react";
import {
  Button,
  Input,
  PageContainer,
  PageHeader,
  Skeleton,
  cn,
} from "@lens/ui";
import { RequestCard } from "@/components/dashboard/RequestCard";
import { useIncomingBookings } from "@/queries/useDashboard";
import type { BookingStatus } from "@/types";

// Group the escrow lifecycle into the stages a photographer works in.
type GroupKey = "pending" | "active" | "done" | "cancelled";
type DateScope = "all" | "upcoming" | "past";

const GROUPS: { key: GroupKey; label: string; statuses: BookingStatus[] }[] = [
  { key: "pending", label: "Cần duyệt", statuses: ["pending"] },
  { key: "active", label: "Đang diễn ra", statuses: ["confirmed", "held"] },
  { key: "done", label: "Hoàn thành", statuses: ["released"] },
  { key: "cancelled", label: "Đã hủy", statuses: ["cancelled"] },
];

const EMPTY_MESSAGE: Record<GroupKey, string> = {
  pending: "Không có yêu cầu nào cần duyệt",
  active: "Chưa có buổi chụp nào đang diễn ra",
  done: "Chưa có buổi chụp nào hoàn thành",
  cancelled: "Không có yêu cầu nào đã hủy",
};

function localDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function DashboardBookings() {
  const { data: bookings = [], isLoading } = useIncomingBookings();
  const [group, setGroup] = useState<GroupKey>("pending");
  const [search, setSearch] = useState("");
  const [dateScope, setDateScope] = useState<DateScope>("all");

  const countFor = (statuses: BookingStatus[]) =>
    bookings.filter((booking) => statuses.includes(booking.status)).length;
  const active = GROUPS.find((item) => item.key === group)!;
  const today = startOfToday();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const pendingCount = countFor(["pending"]);
  const toDeliverCount = countFor(["held"]);
  const upcomingCount = bookings.filter((booking) => {
    if (booking.status !== "confirmed") return false;
    const date = localDate(booking.date);
    return date >= today && date <= weekEnd;
  }).length;
  const completedCount = countFor(["released"]);
  const needsAction = pendingCount > 0 || toDeliverCount > 0;

  const query = search.trim().toLocaleLowerCase("vi-VN");
  const filtered = bookings
    .filter((booking) => active.statuses.includes(booking.status))
    .filter((booking) => {
      if (!query) return true;
      const searchable = [
        booking.clientName,
        booking.contactPhone,
        booking.location,
        booking.style,
        booking.packageSnapshot?.name,
        booking.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi-VN");
      return searchable.includes(query);
    })
    .filter((booking) => {
      if (dateScope === "all") return true;
      const isUpcoming = localDate(booking.date) >= today;
      return dateScope === "upcoming" ? isUpcoming : !isUpcoming;
    });

  const overview = [
    {
      label: "Chờ duyệt",
      value: pendingCount,
      detail: "Yêu cầu cần phản hồi",
      icon: CalendarClock,
      iconClass: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300",
      valueClass: "text-orange-600 dark:text-orange-400",
    },
    {
      label: "Sắp diễn ra tuần này",
      value: upcomingCount,
      detail: "Lịch đã xác nhận trong 7 ngày tới",
      icon: CalendarDays,
      iconClass: "bg-muted text-foreground",
      valueClass: "text-foreground",
    },
    {
      label: "Cần giao trả file",
      value: toDeliverCount,
      detail: "Buổi chụp đang chờ giao ảnh",
      icon: ImageUp,
      iconClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
      valueClass: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "Đã hoàn thành",
      value: completedCount,
      detail: "Khách đã xác nhận nhận ảnh",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      valueClass: "text-emerald-700 dark:text-emerald-400",
    },
  ];

  return (
    <PageContainer className="max-w-[1480px] py-6 md:py-8">
      <PageHeader
        className="mb-6"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
              <CalendarDays className="size-5" />
            </span>
            <span>Quản lý đặt lịch</span>
            <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Studio
            </span>
          </span>
        }
        description="Theo dõi, điều phối và xử lý các buổi chụp của bạn theo thời gian thực."
        actions={
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/dashboard/availability">
              <CalendarCheck2 className="size-4" />
              Xem lịch làm việc
            </Link>
          </Button>
        }
      />

      <section aria-label="Tổng quan lịch đặt" className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overview.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  {isLoading ? (
                    <Skeleton className="mt-2 h-8 w-12" />
                  ) : (
                    <p className={cn("mt-1 text-2xl font-bold tabular-nums", item.valueClass)}>
                      {item.value}
                    </p>
                  )}
                </div>
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.iconClass)}>
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{item.detail}</p>
            </article>
          );
        })}
      </section>

      {!isLoading && needsAction && (
        <section className="mb-6 rounded-2xl border border-orange-200 bg-orange-50/80 p-4 text-orange-950 shadow-sm dark:border-orange-900/70 dark:bg-orange-950/20 dark:text-orange-100 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300">
              <CircleAlert className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold">Việc cần bạn xử lý ngay hôm nay</h2>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-800 dark:bg-orange-900/60 dark:text-orange-200">
                  {pendingCount + toDeliverCount} việc
                </span>
              </div>
              <p className="mt-1 text-sm text-orange-900/75 dark:text-orange-100/75">
                Phản hồi yêu cầu mới và hoàn tất giao ảnh cho các buổi chụp đang chờ.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setGroup("pending")}
                    className="rounded-full border border-orange-200 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-orange-400 dark:border-orange-900 dark:bg-background/50"
                  >
                    {pendingCount} yêu cầu chờ duyệt <span aria-hidden="true">→</span>
                  </button>
                )}
                {toDeliverCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setGroup("active")}
                    className="rounded-full border border-orange-200 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-orange-400 dark:border-orange-900 dark:bg-background/50"
                  >
                    {toDeliverCount} buổi cần giao ảnh <span aria-hidden="true">→</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <ClipboardList className="size-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Danh sách lịch chụp</h2>
              <p className="text-xs text-muted-foreground">
                Phân loại và quản lý trạng thái xử lý các buổi chụp.
              </p>
            </div>
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{filtered.length}</span> lịch
            </p>
          )}
        </div>

        <div className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:pb-0">
              {GROUPS.map((item) => {
                const selected = group === item.key;
                const count = countFor(item.statuses);
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setGroup(item.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition",
                      selected
                        ? "bg-foreground text-background"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] tabular-nums", selected ? "bg-background/15" : "bg-background")}>
                      {isLoading ? "–" : count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:w-[430px] lg:shrink-0">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên khách, SĐT, địa điểm…"
                  aria-label="Tìm lịch đặt"
                  className="h-10 rounded-xl pl-9"
                />
              </label>
              <label className="relative sm:w-40">
                <Filter className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <select
                  aria-label="Lọc lịch theo ngày"
                  value={dateScope}
                  onChange={(event) => setDateScope(event.target.value as DateScope)}
                  className="h-10 w-full appearance-none rounded-xl border border-input bg-card pl-9 pr-8 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">Mọi thời gian</option>
                  <option value="upcoming">Buổi sắp tới</option>
                  <option value="past">Buổi đã qua</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </label>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Inbox className="size-7" />
            </span>
            <p className="font-semibold">
              {query || dateScope !== "all" ? "Không tìm thấy lịch phù hợp" : EMPTY_MESSAGE[group]}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {query || dateScope !== "all"
                ? "Thử thay đổi từ khóa hoặc bộ lọc thời gian."
                : "Các lịch chụp mới hoặc lịch đã cập nhật sẽ xuất hiện ở đây."}
            </p>
            {(query || dateScope !== "all") && (
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => {
                  setSearch("");
                  setDateScope("all");
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((booking) => (
              <RequestCard key={booking.id} booking={booking} variant="bookingGrid" />
            ))}
            {group === "pending" && !query && dateScope === "all" && (
              <article className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-5 py-6 text-center dark:bg-muted/20">
                <span className="flex size-11 items-center justify-center rounded-full bg-background text-muted-foreground shadow-xs">
                  <CalendarDays className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-semibold">Bạn có buổi chụp riêng ngoài hệ thống?</h3>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                  Thêm thời gian bận vào lịch để tránh khách đặt trùng khung giờ.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 rounded-lg bg-card">
                  <Link to="/dashboard/availability">
                    <Plus className="size-3.5" /> Cập nhật lịch làm việc
                  </Link>
                </Button>
              </article>
            )}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
