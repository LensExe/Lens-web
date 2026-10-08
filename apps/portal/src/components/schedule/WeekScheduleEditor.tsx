import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  LockKeyhole,
} from "lucide-react";
import { Button, Input, cn, formatPrice } from "@lens/ui";
import { DaySlotsPanel } from "@/components/schedule/DaySlotsPanel";
import { BOOKING_END_MINUTES, BOOKING_START_MINUTES, TIME_SLOTS } from "@/lib/booking";
import {
  BOOKING_WINDOW_DAYS,
  addDaysISO,
  bookingSlots,
  dayAvailability,
  fromISODate,
  removeBusyRange,
  setBusyAllDay,
  setBusyRange,
  startOfWeekISO,
  timeToMinutes,
  todayISO,
  WEEKDAY_SHORT,
} from "@/lib/schedule";
import type { Booking, DayAvailability, WorkSchedule } from "@/types";

const STATUS_LABEL = {
  free: "Trống",
  busy: "Bận",
  booked: "Đã đặt",
} as const;

const CALENDAR_START = BOOKING_START_MINUTES;
const CALENDAR_END = BOOKING_END_MINUTES;
const SLOT_HEIGHT = 16;
const CALENDAR_HEIGHT = ((CALENDAR_END - CALENDAR_START) / 30) * SLOT_HEIGHT;
const GRID_COLUMNS = "grid-cols-[2.5rem_repeat(7,minmax(0,1fr))]";

const weekLabel = (start: string, end: string) => {
  const from = fromISODate(start);
  const to = fromISODate(end);
  const fromMonth = from.getMonth() + 1;
  const toMonth = to.getMonth() + 1;
  return fromMonth === toMonth
    ? `${from.getDate()} – ${to.getDate()} Tháng ${toMonth}, ${to.getFullYear()}`
    : `${from.getDate()} Tháng ${fromMonth} – ${to.getDate()} Tháng ${toMonth}, ${to.getFullYear()}`;
};

const dayDateLabel = (iso: string) => fromISODate(iso).getDate();

const minutesFromStart = (time: string) => timeToMinutes(time) - CALENDAR_START;

const visibleTimes = TIME_SLOTS.filter((time) => {
  const minutes = timeToMinutes(time);
  return minutes >= CALENDAR_START && minutes < CALENDAR_END;
});

const bookingPalette = [
  { border: "#f97316", background: "#fff7ed" },
  { border: "#0f766e", background: "#f0fdfa" },
  { border: "#ea580c", background: "#fff7ed" },
  { border: "#7c3aed", background: "#f5f3ff" },
];

function BookingCard({ booking, index }: { booking: Booking; index: number }) {
  const start = booking.timeSlot ?? "08:00";
  const duration = booking.packageSnapshot?.durationHours ?? 2;
  const top = minutesFromStart(start) * (SLOT_HEIGHT / 30);
  const height = Math.max(42, duration * 60 * (SLOT_HEIGHT / 30) - 4);
  const palette = bookingPalette[index % bookingPalette.length];
  const canRender = top + height > 0 && top < CALENDAR_HEIGHT;

  if (!canRender) return null;

  return (
    <Link
      to={`/dashboard/bookings/${booking.id}`}
      title={`${booking.clientName} · ${start}`}
      className="absolute z-20 overflow-hidden rounded-md border border-border/80 border-l-[3px] p-1.5 text-[9px] leading-[1.15] shadow-sm transition-shadow hover:z-30 hover:shadow-md"
      style={{
        top: Math.max(2, top),
        height: Math.min(height, CALENDAR_HEIGHT - Math.max(2, top) - 2),
        left: 3,
        right: 3,
        borderLeftColor: palette.border,
        backgroundColor: palette.background,
      }}
    >
      <span className="block truncate font-bold text-foreground">{booking.clientName}</span>
      <span className="mt-0.5 block truncate text-muted-foreground">{booking.style}</span>
      <span className="mt-1 block truncate font-medium tabular-nums text-foreground">
        {start} · {formatPrice(booking.price)}
      </span>
      {height >= 70 && (
        <span className="mt-1 block truncate text-[8px] text-muted-foreground">
          {booking.location}
        </span>
      )}
    </Link>
  );
}

function TimeRail() {
  return (
    <div className="relative border-r border-border bg-muted/20" style={{ height: CALENDAR_HEIGHT }}>
      {visibleTimes
        .filter((time) => time.endsWith(":00"))
        .map((time) => (
          <span
            key={time}
            className="absolute left-0 right-1 -translate-y-1/2 text-right text-[10px] tabular-nums text-muted-foreground"
            style={{ top: minutesFromStart(time) * (SLOT_HEIGHT / 30) }}
          >
            {time}
          </span>
        ))}
      <span
        className="absolute bottom-0 left-0 right-1 translate-y-1/2 text-right text-[10px] tabular-nums text-muted-foreground"
      >
        24:00
      </span>
    </div>
  );
}

function DayTimeline({
  day,
  bookings,
  today,
  selected,
  onSelect,
}: {
  day: DayAvailability;
  bookings: Booking[];
  today: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const isPast = day.date < today;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayBookings = [...bookings]
    .filter((booking) => booking.timeSlot)
    .sort((a, b) => (a.timeSlot ?? "").localeCompare(b.timeSlot ?? ""));
  return (
    <div
      className={cn(
        "relative border-r last:border-r-0",
        isPast ? "border-border/35 bg-muted/35" : "border-border/80 bg-muted/[0.04]",
        selected && !isPast && "bg-ember/[0.045] ring-1 ring-inset ring-ember/25"
      )}
      style={{ height: CALENDAR_HEIGHT }}
      onClick={isPast ? undefined : onSelect}
      aria-disabled={isPast}
    >
      {isPast ? (
        <div
          className="absolute inset-0 cursor-default border-x border-border/25 bg-muted/35"
          aria-label={`${day.date}: ngày đã qua, chỉ xem`}
        >
          {dayBookings.length === 0 && (
            <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] text-muted-foreground/60">
              Đã qua
            </span>
          )}
        </div>
      ) : (
        visibleTimes.map((time) => {
          const slot = day.slots.find((item) => item.time === time);
          const status = slot?.status;
          const expired = day.date === today && timeToMinutes(time) < currentMinutes;
          return (
            <div
              key={`${day.date}-${time}`}
              aria-label={`${day.date} ${time}: ${expired ? "Đã qua" : status ? STATUS_LABEL[status] : "Ngày nghỉ"}`}
              title={expired ? "Đã qua" : status ? STATUS_LABEL[status] : "Ngày nghỉ"}
              className={cn(
                "absolute left-0 right-0 h-4 border-b border-border/60 transition-colors",
                expired && "pointer-events-none border-border/25 bg-muted/35",
                !expired && status === "free" && "bg-background hover:bg-ember/10",
                !expired && status === "busy" && "bg-amber-100/75 dark:bg-amber-500/10",
                !expired && status === "booked" && "bg-ember/10 dark:bg-ember/15",
                !expired && !status && "bg-muted/20"
              )}
              style={{ top: minutesFromStart(time) * (SLOT_HEIGHT / 30) }}
            />
          );
        })
      )}

      {dayBookings.map((booking, index) => (
        <BookingCard key={booking.id} booking={booking} index={index} />
      ))}

      {!isPast && dayBookings.length === 0 && day.slots.length === 0 && (
        <span className="pointer-events-none absolute inset-x-0 top-1/2 text-center text-[9px] text-muted-foreground/50">
          Nghỉ
        </span>
      )}
    </div>
  );
}

/**
 * A calendar-first weekly view. Photographer availability is open by default;
 * this timeline is for scanning bookings and adding date-specific busy ranges.
 */
export function WeekScheduleEditor({
  schedule,
  bookingsByDate,
  onChange,
  readOnly = false,
  windowDays = BOOKING_WINDOW_DAYS,
}: {
  schedule: WorkSchedule;
  bookingsByDate: Record<string, Booking[]>;
  onChange: (next: WorkSchedule) => void;
  /** Hide the legacy local schedule editor when the calendar is backed by /calendar/me. */
  readOnly?: boolean;
  /** Number of future days exposed by the backend calendar query. */
  windowDays?: number;
}) {
  const today = todayISO();
  const bookingEnd = addDaysISO(today, windowDays);
  const currentWeek = startOfWeekISO(today);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(addDaysISO(today, 1));
  const weekStart = addDaysISO(currentWeek, weekOffset * 7);
  const weekEnd = addDaysISO(weekStart, 6);
  const previousWeek = weekOffset > -1;
  const nextWeek = weekStart < startOfWeekISO(bookingEnd);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysISO(weekStart, index);
    return dayAvailability(
      schedule,
      date,
      (bookingsByDate[date] ?? []).flatMap((booking) => bookingSlots(booking))
    );
  });

  const selectedDay = days.find((day) => day.date === selectedDate) ?? days[0];
  const selectedEditable = Boolean(
    selectedDay && selectedDay.date > today && selectedDay.date <= bookingEnd
  );
  const selectedBusyAllDay = Boolean(
    selectedDay &&
      schedule.busy.some((block) => block.date === selectedDay.date && block.ranges.length === 0)
  );

  const selectDate = (date: string) => {
    if (!date || date <= today || date > bookingEnd) return;
    const targetWeek = startOfWeekISO(date);
    const offset = Math.round(
      (fromISODate(targetWeek).getTime() - fromISODate(currentWeek).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );
    if (offset < -1 || targetWeek > startOfWeekISO(bookingEnd)) return;
    setWeekOffset(offset);
    setSelectedDate(date);
  };

  const moveWeek = (delta: number) => {
    const nextOffset = weekOffset + delta;
    if (nextOffset < -1 || (delta > 0 && !nextWeek)) return;
    setWeekOffset(nextOffset);
    const nextStart = addDaysISO(currentWeek, nextOffset * 7);
    const nextDate =
      nextStart <= today && addDaysISO(nextStart, 6) >= today
        ? addDaysISO(today, 1)
        : nextStart;
    setSelectedDate(nextDate);
  };

  const selectToday = () => {
    setWeekOffset(0);
    setSelectedDate(addDaysISO(today, 1));
  };

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-3 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember shadow-sm">
            <CalendarDays className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight">Lịch theo tuần</h2>
            <p className="truncate text-xs text-muted-foreground">
              Khách có thể bắt đầu từ 07:00 đến trước 24:00 · booking đã có khách được khóa
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full bg-background px-3 text-xs shadow-xs"
              onClick={selectToday}
            >
              Ngày gần nhất
            </Button>
            <label htmlFor="schedule-date-picker" className="sr-only">
              Chọn ngày tương lai
            </label>
            <Input
              id="schedule-date-picker"
              type="date"
              min={addDaysISO(today, 1)}
              max={bookingEnd}
              value={selectedDate}
              onChange={(event) => selectDate(event.target.value)}
              className="h-8 w-[142px] rounded-full bg-background px-2.5 text-xs shadow-xs"
              aria-label="Chọn ngày tương lai"
            />
          </div>
          <div className="flex items-center rounded-full border border-border/70 bg-background p-0.5 shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              disabled={!previousWeek}
              onClick={() => moveWeek(-1)}
              aria-label="Xem tuần trước"
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-44 px-2 text-center text-xs font-semibold tabular-nums sm:min-w-48">
              {weekLabel(weekStart, weekEnd)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              disabled={!nextWeek}
              onClick={() => moveWeek(1)}
              aria-label="Xem tuần sau"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 w-full overflow-hidden rounded-2xl border border-border/70 bg-background shadow-inner">
        <div className="w-full min-w-0">
          <div className={cn("grid bg-muted/45", GRID_COLUMNS)}>
            <div className="border-b border-r border-border/70 px-2 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Giờ
            </div>
            {days.map((day) => {
              const date = fromISODate(day.date);
              const isToday = day.date === today;
              const isSelected = day.date === selectedDate;
              const isPast = day.date < today;
              const bookingCount = (bookingsByDate[day.date] ?? []).length;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "focus-ring min-h-[62px] border-b border-r px-2 py-2 text-center transition-colors last:border-r-0",
                    isPast
                      ? "cursor-default border-border/35 bg-muted/35 text-muted-foreground/70"
                      : "border-border/70 hover:bg-background/90",
                    isSelected && !isPast && "bg-ember/10 ring-1 ring-inset ring-ember/30"
                  )}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {WEEKDAY_SHORT[date.getDay()]}
                  </span>
                  <span className="mt-1 flex items-center justify-center gap-1.5 text-base font-semibold tabular-nums">
                    {dayDateLabel(day.date)}
                    {isToday && <span className="size-1.5 rounded-full bg-lagoon" />}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                    {isPast
                      ? bookingCount > 0
                        ? `${bookingCount} booking`
                        : "Đã qua"
                      : bookingCount > 0
                        ? `${bookingCount} booking`
                        : day.slots.length
                          ? `${day.slots.length} khung`
                          : "Nghỉ"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={cn("grid", GRID_COLUMNS)}>
            <TimeRail />
            {days.map((day) => (
              <DayTimeline
                key={day.date}
                day={day}
                bookings={bookingsByDate[day.date] ?? []}
                today={today}
                selected={day.date === selectedDate}
                onSelect={() => setSelectedDate(day.date)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Chú thích</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-border border-l-2 border-l-foreground bg-card" /> Có khách
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amber-200 dark:bg-amber-500/50" /> Bận
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-background ring-1 ring-border" /> Trống
        </span>
        <span className="flex items-center gap-1.5">
          <LockKeyhole className="size-3" /> Booking đã khóa
        </span>
      </div>

      {selectedDay && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <DaySlotsPanel
            key={selectedDay.date}
            day={selectedDay}
            bookings={bookingsByDate[selectedDay.date] ?? []}
            busyRanges={schedule.busy.find((block) => block.date === selectedDay.date)?.ranges ?? []}
            busyAllDay={selectedBusyAllDay}
            readOnly={readOnly || !selectedEditable}
            minDate={addDaysISO(today, 1)}
            maxDate={bookingEnd}
            onSelectDate={selectDate}
            onBusyAllDay={(busy) => onChange(setBusyAllDay(schedule, selectedDay.date, busy))}
            onBusyRange={(range) => onChange(setBusyRange(schedule, selectedDay.date, range))}
            onRemoveBusyRange={(index) => onChange(removeBusyRange(schedule, selectedDay.date, index))}
          />
          <aside className="rounded-2xl border border-border/70 bg-muted/25 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cách dùng lịch</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Chọn ngày trên lịch hoặc nhập ngày ở bộ chọn phía trên. Dùng phần bên dưới để
                  đánh dấu một khoảng bận, không cần chỉnh mẫu giờ làm việc.
                </p>
              </div>
            </div>
            {!selectedEditable && (
              <p className="mt-3 rounded-lg bg-background px-2.5 py-2 text-[11px] text-muted-foreground">
                Ngày này chỉ hiển thị để xem, không thể chỉnh sửa.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
