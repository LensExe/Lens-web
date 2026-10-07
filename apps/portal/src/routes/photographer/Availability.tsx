import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, CalendarX, Clock3, Loader2, Trash2 } from "lucide-react";
import { Button, Input, PageContainer, PageHeader, Skeleton, toast } from "@lens/ui";
import { WeekScheduleEditor } from "@/components/schedule/WeekScheduleEditor";
import {
  useCreateCalendarBlock,
  useMyCalendar,
  useRemoveCalendarBlock,
} from "@/queries/useCalendar";
import {
  addVietnamDaysISO,
  VIETNAM_TIME_ZONE,
  toVietnamIso,
  todayVietnamISO,
  vietnamDateTimeParts,
  vietnamDayRange,
} from "@/lib/vietnam-time";
import type { Booking, BookingStatus, TimeRange, WorkSchedule } from "@/types";

type CalendarRow = Record<string, unknown>;
const text = (row: CalendarRow, key: string) =>
  typeof row[key] === "string" ? (row[key] as string) : "";
const number = (row: CalendarRow, key: string) =>
  typeof row[key] === "number" ? (row[key] as number) : 0;

const BOOKING_STATUSES = new Set(["pending", "accepted", "in_progress", "shot", "completed"]);

function mapBookingStatus(status: string): BookingStatus {
  switch (status) {
    case "accepted":
      return "confirmed";
    case "in_progress":
    case "shot":
      return "held";
    case "completed":
      return "released";
    case "rejected":
    case "cancelled":
    case "expired":
      return "cancelled";
    default:
      return "pending";
  }
}

function asRecord(value: unknown): CalendarRow {
  return value && typeof value === "object" ? (value as CalendarRow) : {};
}

/** Convert a raw calendar booking into one or more Vietnam-local timeline cards. */
function mapCalendarBookings(row: CalendarRow): Booking[] {
  const from = text(row, "from");
  const to = text(row, "to");
  const start = Date.parse(from);
  const end = Date.parse(to);
  const first = vietnamDateTimeParts(start)?.date;
  const last = vietnamDateTimeParts(end - 1)?.date;
  if (!first || !last || !Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return [];

  const customer = asRecord(row.customer);
  const rawStatus = text(row, "status");
  const base = {
    id: text(row, "id"),
    clientId: text(row, "customer_id"),
    clientName:
      text(row, "customer_name") ||
      text(row, "customer_fullname") ||
      text(customer, "fullname") ||
      "Khách hàng",
    photographerId: text(row, "photographer_id"),
    photographerName: "Bạn",
    style: "" as const,
    location: text(row, "location"),
    price: number(row, "total_amount"),
    status: mapBookingStatus(rawStatus),
    backendStatus: rawStatus as Booking["backendStatus"],
    depositAmount: number(row, "deposit_amount"),
    collaborators: [],
  };

  const segments: Booking[] = [];
  for (let date = first; date <= last; date = addVietnamDaysISO(date, 1)) {
    const dayStart = Date.parse(toVietnamIso(date, "00:00"));
    const dayEnd = Date.parse(toVietnamIso(addVietnamDaysISO(date, 1), "00:00"));
    const segmentStart = Math.max(start, dayStart);
    const segmentEnd = Math.min(end, dayEnd);
    const parts = vietnamDateTimeParts(segmentStart);
    if (!parts || segmentStart >= segmentEnd) continue;
    segments.push({
      ...base,
      date,
      packageSnapshot: {
        name: "Buổi chụp",
        photoCount: 0,
        durationHours: Math.max(0.5, (segmentEnd - segmentStart) / 3_600_000),
      },
      timeSlot: parts.time,
    });
  }
  return segments;
}

const minutesOf = (time: string) => {
  if (time === "24:00") return 24 * 60;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const timeOfMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * The backend stores an offline range as UTC instants. Split it at Vietnam
 * midnights so a block around 00:00 never paints the wrong calendar day.
 */
function busyBlocksFromCalendar(rows: CalendarRow[]): WorkSchedule["busy"] {
  const byDate = new Map<string, { allDay: boolean; ranges: TimeRange[] }>();

  for (const row of rows) {
    const from = Date.parse(text(row, "from"));
    const to = Date.parse(text(row, "to"));
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) continue;

    const first = vietnamDateTimeParts(from)?.date;
    const last = vietnamDateTimeParts(to - 1)?.date;
    if (!first || !last) continue;

    for (let date = first; date <= last; date = addVietnamDaysISO(date, 1)) {
      const dayStart = Date.parse(toVietnamIso(date, "00:00"));
      const dayEnd = Date.parse(toVietnamIso(addVietnamDaysISO(date, 1), "00:00"));
      const rangeStart = Math.max(from, dayStart);
      const rangeEnd = Math.min(to, dayEnd);
      if (rangeStart >= rangeEnd) continue;

      const current = byDate.get(date) ?? { allDay: false, ranges: [] };
      if (rangeStart <= dayStart && rangeEnd >= dayEnd) {
        current.allDay = true;
        current.ranges = [];
      } else if (!current.allDay) {
        const startParts = vietnamDateTimeParts(rangeStart);
        const endParts = vietnamDateTimeParts(rangeEnd);
        if (startParts && endParts) {
          const start = Math.max(0, Math.floor(minutesOf(startParts.time) / 30) * 30);
          const end = Math.min(24 * 60, Math.ceil(minutesOf(endParts.time) / 30) * 30 || 24 * 60);
          if (start < end)
            current.ranges.push({ start: timeOfMinutes(start), end: timeOfMinutes(end) });
        }
      }
      byDate.set(date, current);
    }
  }

  return [...byDate.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => {
      if (value.allDay) return { date, ranges: [] };
      const ranges = [...value.ranges].sort(
        (left, right) => minutesOf(left.start) - minutesOf(right.start),
      );
      const merged: TimeRange[] = [];
      for (const range of ranges) {
        const previous = merged.at(-1);
        if (previous && minutesOf(range.start) <= minutesOf(previous.end)) {
          if (minutesOf(range.end) > minutesOf(previous.end)) previous.end = range.end;
        } else {
          merged.push({ ...range });
        }
      }
      return { date, ranges: merged };
    });
}

function localDateTime(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: VIETNAM_TIME_ZONE,
  }).format(new Date(value));
}

function localDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeZone: VIETNAM_TIME_ZONE,
  }).format(new Date(toVietnamIso(value, "00:00")));
}

export function PhotographerAvailability() {
  const range = useMemo(() => {
    return vietnamDayRange(60);
  }, []);
  const calendar = useMyCalendar(range);
  const createBlock = useCreateCalendarBlock();
  const removeBlock = useRemoveCalendarBlock();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [allDay, setAllDay] = useState(false);
  const [reason, setReason] = useState("");
  const [declinePending, setDeclinePending] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!date) return;

    if (!allDay && (!startTime || !endTime || endTime <= startTime)) {
      toast.error("Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    const range = allDay
      ? { date }
      : {
          from: toVietnamIso(date, startTime),
          to: toVietnamIso(date, endTime),
        };

    createBlock.mutate(
      { ...range, reason: reason.trim() || undefined, decline_pending: declinePending },
      {
        onSuccess: () => {
          setDate("");
          setStartTime("08:00");
          setEndTime("09:00");
          setAllDay(false);
          setReason("");
          setDeclinePending(false);
          toast.success("Đã thêm lịch bận");
        },
        onError: () =>
          toast.error(
            "Không thể thêm lịch bận. Nếu có booking chờ duyệt trùng giờ, hãy bật tùy chọn từ chối yêu cầu.",
          ),
      },
    );
  };

  if (calendar.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="mt-5 h-80 rounded-2xl" />
      </PageContainer>
    );
  }

  if (calendar.isError || !calendar.data) {
    return (
      <PageContainer className="py-10">
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          Không tải được lịch từ backend.
        </p>
      </PageContainer>
    );
  }

  const blocks = calendar.data.blocked as CalendarRow[];
  const bookings = calendar.data.bookings as CalendarRow[];
  // The current backend opens the photographer's calendar by default from
  // 07:00 to 24:00. Offline ranges and bookings carve busy cells out of it.
  const schedule: WorkSchedule = {
    weekly: Array.from({ length: 7 }, () => [{ start: "07:00", end: "24:00" }]),
    busy: busyBlocksFromCalendar(blocks),
  };
  const bookingsByDate: Record<string, Booking[]> = {};
  bookings.forEach((row) => {
    if (!BOOKING_STATUSES.has(text(row, "status"))) return;
    for (const booking of mapCalendarBookings(row)) {
      (bookingsByDate[booking.date] ??= []).push(booking);
    }
  });

  return (
    <PageContainer className="max-w-300 py-6 md:py-8">
      <PageHeader
        className="mb-5"
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-ember/10 text-ember">
              <CalendarDays className="size-4.5" />
            </span>
            Lịch làm việc
          </span>
        }
        description="Theo dõi toàn bộ khung giờ trong ngày, booking đã giữ lịch và những khoảng bạn không thể nhận khách."
      />

      <section aria-label="Bảng lịch làm việc" className="mt-5">
        <WeekScheduleEditor
          schedule={schedule}
          bookingsByDate={bookingsByDate}
          onChange={() => undefined}
          readOnly
          windowDays={60}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Bảng hiển thị theo giờ Việt Nam (UTC+7). Khung trống mặc định từ 07:00 đến 24:00; lịch bận
          và booking được ghép theo từng mốc 30 phút.
        </p>
      </section>

      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Thêm lịch bận</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn ngày và khoảng giờ bạn không thể nhận booking.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(event) => setAllDay(event.target.checked)}
            />
            Bận cả ngày
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium">
            Ngày
            <Input
              type="date"
              value={date}
              min={todayVietnamISO()}
              onChange={(event) => setDate(event.target.value)}
              required
              className="rounded-xl"
            />
          </label>
          {!allDay && (
            <>
              <label className="grid gap-1.5 text-sm font-medium">
                Giờ bắt đầu
                <Input
                  type="time"
                  step={1800}
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  required
                  className="rounded-xl"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Giờ kết thúc
                <Input
                  type="time"
                  step={1800}
                  value={endTime}
                  min={startTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                  className="rounded-xl"
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Lý do (không bắt buộc)"
            aria-label="Lý do bận"
            className="rounded-xl"
          />
          <Button
            type="submit"
            className="rounded-xl"
            disabled={!date || (!allDay && (!startTime || !endTime)) || createBlock.isPending}
          >
            {createBlock.isPending && <Loader2 className="size-4 animate-spin" />}
            Lưu lịch bận
          </Button>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={declinePending}
            onChange={(event) => setDeclinePending(event.target.checked)}
          />
          Từ chối booking đang chờ duyệt nếu trùng thời gian
        </label>
      </form>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarX className="size-4 text-ember" /> Lịch bận đã đăng ký{" "}
            <span className="text-sm font-normal text-muted-foreground">({blocks.length})</span>
          </h2>
          {blocks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có khoảng bận nào trong lịch.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {blocks.map((block) => {
                const id = text(block, "id");
                const date = text(block, "date");
                const from = text(block, "from");
                const to = text(block, "to");
                return (
                  <li key={id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {date
                          ? `${localDate(date)} · Cả ngày`
                          : `${localDateTime(from)} – ${localDateTime(to)}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {text(block, "reason") || "Không có ghi chú"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Xóa khoảng bận"
                      disabled={removeBlock.isPending}
                      onClick={() =>
                        removeBlock.mutate(id, {
                          onSuccess: () => toast.success("Đã mở lịch"),
                          onError: () => toast.error("Không thể xóa khoảng bận"),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <Clock3 className="size-4 text-lagoon" /> Booking 60 ngày tới{" "}
            <span className="text-sm font-normal text-muted-foreground">({bookings.length})</span>
          </h2>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Không có booking trong khoảng thời gian này.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {bookings.map((booking) => (
                <li key={text(booking, "id")} className="py-3">
                  <p className="text-sm font-medium">
                    {localDateTime(text(booking, "from"))} – {localDateTime(text(booking, "to"))}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {text(booking, "location")} · {text(booking, "status")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
