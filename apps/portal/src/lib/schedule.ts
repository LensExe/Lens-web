import { TIME_SLOTS } from "@/lib/booking";
import { todayVietnamISO } from "@/lib/vietnam-time";
import type { Booking, DayAvailability, TimeRange, WorkSchedule } from "@/types";

// Schedule helpers shared by the mock backend, public booking flow and the
// photographer's editor. Availability uses 30-minute precision, but schedules
// are stored as compact ranges instead of a list of dozens of individual cells.

export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const WEEKDAY_NAME = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
/** Vietnamese weeks start on Monday. Values are `Date.getDay()` indexes. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
/** How far ahead clients can book (and the studio calendar looks). */
export const BOOKING_WINDOW_DAYS = 35;
export const DEFAULT_WORKING_RANGE: TimeRange = { start: "07:00", end: "24:00" };

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fromISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDaysISO = (iso: string, days: number) => {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};
export const startOfWeekISO = (iso: string) => {
  const day = fromISODate(iso).getDay();
  return addDaysISO(iso, -(day === 0 ? 6 : day - 1));
};
export const todayISO = todayVietnamISO;
const weekdayOf = (iso: string) => fromISODate(iso).getDay();

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export const addMinutesToTime = (time: string, minutes: number) =>
  minutesToTime(timeToMinutes(time) + minutes);

const isValidTime = (time: unknown) =>
  typeof time === "string" && (time === "24:00" || /^([01]\d|2[0-3]):[03]0$/.test(time));

const validRange = (range: TimeRange) =>
  isValidTime(range.start) &&
  isValidTime(range.end) &&
  timeToMinutes(range.start) < timeToMinutes(range.end);

const sortTimes = (slots: string[]) =>
  [...new Set(slots)].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

export const rangesToSlots = (ranges: TimeRange[]) =>
  TIME_SLOTS.filter((time) =>
    ranges.some(
      (range) => timeToMinutes(time) >= timeToMinutes(range.start) && timeToMinutes(time) < timeToMinutes(range.end)
    )
  );

export const slotsToRanges = (slots: string[]): TimeRange[] => {
  const sorted = sortTimes(slots.filter((slot) => TIME_SLOTS.includes(slot)));
  const ranges: TimeRange[] = [];
  for (const slot of sorted) {
    const previous = ranges.at(-1);
    if (previous && timeToMinutes(slot) === timeToMinutes(previous.end)) {
      previous.end = addMinutesToTime(slot, 30);
    } else {
      ranges.push({ start: slot, end: addMinutesToTime(slot, 30) });
    }
  }
  return ranges;
};

export const slotsForDuration = (start: string, durationHours: number) => {
  if (!isValidTime(start) || durationHours <= 0) return [];
  const count = Math.ceil((durationHours * 60) / 30);
  return Array.from({ length: count }, (_, i) => addMinutesToTime(start, i * 30)).filter((time) =>
    TIME_SLOTS.includes(time)
  );
};

/** Occupied half-hour cells for one booking, including its package duration. */
export const bookingSlots = (booking: Pick<Booking, "timeSlot" | "packageSnapshot">) =>
  slotsForDuration(booking.timeSlot ?? "", booking.packageSnapshot?.durationHours ?? 2);

/** "Thứ 3, 30/09" */
export const dayLabel = (iso: string) => {
  const d = fromISODate(iso);
  return `${WEEKDAY_NAME[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const emptySchedule = (): WorkSchedule => ({
  weekly: Array.from({ length: 7 }, () => [{ ...DEFAULT_WORKING_RANGE }]),
  busy: [],
});

/** A booking holds every half-hour cell covered by its package duration. */
export function occupiesSlot(b: Pick<Booking, "status" | "depositDeadline">, nowISO: string) {
  if (b.status === "awaiting_deposit") return !b.depositDeadline || b.depositDeadline > nowISO;
  return b.status === "pending" || b.status === "confirmed" || b.status === "held";
}

/** One day as clients see it: working cells plus held cells, each with a status. */
export function dayAvailability(
  schedule: WorkSchedule,
  date: string,
  booked: string[] = []
): DayAvailability {
  const working = rangesToSlots(schedule.weekly[weekdayOf(date)] ?? []);
  const block = schedule.busy.find((b) => b.date === date);
  const busy = block ? (block.ranges.length === 0 ? working : rangesToSlots(block.ranges)) : [];
  const visible = new Set([...working, ...booked]);
  return {
    date,
    slots: TIME_SLOTS.filter((time) => visible.has(time)).map((time) => ({
      time,
      status: booked.includes(time)
        ? "booked"
        : busy.includes(time)
          ? "busy"
          : "free",
    })),
  };
}

export const countSlots = (day: DayAvailability, status: "free" | "busy" | "booked") =>
  day.slots.filter((s) => s.status === status).length;

// ── Editor operations ───────────────────────────────────────────────────────

export function toggleWeeklySlot(s: WorkSchedule, weekday: number, slot: string): WorkSchedule {
  const current = rangesToSlots(s.weekly[weekday] ?? []);
  const next = current.includes(slot) ? current.filter((time) => time !== slot) : [...current, slot];
  return { ...s, weekly: s.weekly.map((d, i) => (i === weekday ? slotsToRanges(next) : d)) };
}

export function setDayWorking(s: WorkSchedule, weekday: number, working: boolean): WorkSchedule {
  return {
    ...s,
    weekly: s.weekly.map((d, i) =>
      i === weekday ? (working ? [{ ...DEFAULT_WORKING_RANGE }] : []) : d
    ),
  };
}

export function applyPreset(s: WorkSchedule, weekdays: number[]): WorkSchedule {
  return {
    ...s,
    weekly: s.weekly.map((_, i) => (weekdays.includes(i) ? [{ ...DEFAULT_WORKING_RANGE }] : [])),
  };
}

export const SCHEDULE_PRESETS: { id: string; label: string; weekdays: number[] }[] = [
  { id: "all", label: "Cả tuần", weekdays: [0, 1, 2, 3, 4, 5, 6] },
  { id: "weekdays", label: "Ngày thường", weekdays: [1, 2, 3, 4, 5] },
  { id: "weekend", label: "Cuối tuần", weekdays: [0, 6] },
  { id: "clear", label: "Xoá hết", weekdays: [] },
];

const withBlock = (s: WorkSchedule, date: string, ranges: TimeRange[] | null): WorkSchedule => ({
  ...s,
  busy:
    ranges === null
      ? s.busy.filter((b) => b.date !== date)
      : [...s.busy.filter((b) => b.date !== date), { date, ranges }].sort((a, b) => a.date.localeCompare(b.date)),
});

export function setBusyAllDay(s: WorkSchedule, date: string, busy: boolean): WorkSchedule {
  return withBlock(s, date, busy ? [] : null);
}

/** Add one arbitrary half-hour-aligned busy range to a date. */
export function setBusyRange(
  s: WorkSchedule,
  date: string,
  range: TimeRange
): WorkSchedule {
  const block = s.busy.find((b) => b.date === date);
  const working = rangesToSlots(s.weekly[weekdayOf(date)] ?? []);
  const current = !block ? [] : block.ranges.length === 0 ? working : rangesToSlots(block.ranges);
  const added = rangesToSlots([range]);
  return withBlock(s, date, slotsToRanges([...current, ...added]));
}

export function removeBusyRange(s: WorkSchedule, date: string, index: number): WorkSchedule {
  const block = s.busy.find((b) => b.date === date);
  if (!block || block.ranges.length === 0) return s;
  const ranges = block.ranges.filter((_, rangeIndex) => rangeIndex !== index);
  return withBlock(s, date, ranges.length ? ranges : null);
}

/** Flip one 30-minute cell between free and busy on a specific date. */
export function toggleBusySlot(s: WorkSchedule, date: string, slot: string): WorkSchedule {
  const block = s.busy.find((b) => b.date === date);
  const working = rangesToSlots(s.weekly[weekdayOf(date)] ?? []);
  const current = !block ? [] : block.ranges.length === 0 ? working : rangesToSlots(block.ranges);
  const next = current.includes(slot) ? current.filter((time) => time !== slot) : [...current, slot];
  return withBlock(s, date, next.length === 0 ? null : slotsToRanges(next));
}

const legacySlotsToRanges = (slots: string[]) => {
  // Old mock/localStorage schedules used six two-hour start points. Keep them
  // readable after the interval migration instead of silently dropping them.
  const oldStart = new Set(["08:00", "10:00", "14:00", "16:00", "18:00", "20:00"]);
  return slots.flatMap((slot) =>
    oldStart.has(slot) ? [{ start: slot, end: addMinutesToTime(slot, 120) }] : slotsToRanges([slot])
  );
};

const normalizeRanges = (raw: unknown): TimeRange[] => {
  if (!Array.isArray(raw)) return [];
  if (raw.every((item) => typeof item === "string")) {
    return legacySlotsToRanges(raw as string[]).filter(validRange);
  }
  return raw
    .filter((item): item is TimeRange => !!item && typeof item === "object")
    .map((item) => ({ start: String(item.start), end: String(item.end) }))
    .filter(validRange)
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
};

/** Server-side guard plus migration for schedules saved before interval support. */
export function sanitizeSchedule(
  raw: Partial<WorkSchedule> & { weekly?: unknown[]; busy?: unknown[] },
  fromISO: string
): WorkSchedule {
  const weeklyRaw = Array.isArray(raw.weekly) ? raw.weekly : [];
  const busyRaw: unknown[] = Array.isArray(raw.busy) ? raw.busy : [];
  return {
    weekly: Array.from({ length: 7 }, (_, i) => normalizeRanges(weeklyRaw[i])),
    busy: busyRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .filter((item) => typeof item.date === "string" && item.date >= fromISO)
      .map((item) => ({
        date: item.date as string,
        ranges: normalizeRanges(item.ranges ?? item.slots),
      })),
  };
}
