import { TIME_SLOTS } from "@/lib/booking";
import type { Booking, DayAvailability, SlotStatus, WorkSchedule } from "@/types";

// Work schedule helpers — pure functions shared by the mock backend (which
// computes public availability) and the studio editor (which previews a draft
// before it's saved).

export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
export const WEEKDAY_NAME = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
/** Vietnamese weeks start on Monday. Values are `Date.getDay()` indexes. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** How far ahead clients can book (and the studio calendar looks). */
export const BOOKING_WINDOW_DAYS = 35;

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
export const todayISO = () => toISODate(new Date());
const weekdayOf = (iso: string) => fromISODate(iso).getDay();

/** "Thứ 3, 30/09" */
export const dayLabel = (iso: string) => {
  const d = fromISODate(iso);
  return `${WEEKDAY_NAME[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const sortSlots = (slots: string[]) =>
  [...new Set(slots)].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b));

export const emptySchedule = (): WorkSchedule => ({
  weekly: Array.from({ length: 7 }, () => []),
  busy: [],
});

/**
 * A booking holds its slot while an unpaid hold is still inside its deposit
 * window, and from payment until the shoot is delivered.
 */
export function occupiesSlot(b: Pick<Booking, "status" | "depositDeadline">, nowISO: string) {
  if (b.status === "awaiting_deposit") return !b.depositDeadline || b.depositDeadline > nowISO;
  return b.status === "pending" || b.status === "confirmed" || b.status === "held";
}

/**
 * One day as clients see it: the weekday's working slots (plus any slot a
 * booking already holds), each free / busy / booked.
 */
export function dayAvailability(
  schedule: WorkSchedule,
  date: string,
  booked: string[] = []
): DayAvailability {
  const working = schedule.weekly[weekdayOf(date)] ?? [];
  const block = schedule.busy.find((b) => b.date === date);
  const busyAllDay = !!block && block.slots.length === 0;
  return {
    date,
    slots: sortSlots([...working, ...booked]).map((time) => {
      const status: SlotStatus = booked.includes(time)
        ? "booked"
        : busyAllDay || block?.slots.includes(time)
          ? "busy"
          : "free";
      return { time, status };
    }),
  };
}

export const countSlots = (day: DayAvailability, status: SlotStatus) =>
  day.slots.filter((s) => s.status === status).length;

// ── Editor operations (return a new schedule) ─────────────────────────────────

export function toggleWeeklySlot(s: WorkSchedule, weekday: number, slot: string): WorkSchedule {
  const day = s.weekly[weekday];
  const next = day.includes(slot) ? day.filter((t) => t !== slot) : sortSlots([...day, slot]);
  return { ...s, weekly: s.weekly.map((d, i) => (i === weekday ? next : d)) };
}

/** "Nghỉ" switch: off clears the day, on opens every slot. */
export function setDayWorking(s: WorkSchedule, weekday: number, working: boolean): WorkSchedule {
  return {
    ...s,
    weekly: s.weekly.map((d, i) => (i === weekday ? (working ? [...TIME_SLOTS] : []) : d)),
  };
}

export function applyPreset(s: WorkSchedule, weekdays: number[]): WorkSchedule {
  return {
    ...s,
    weekly: s.weekly.map((_, i) => (weekdays.includes(i) ? [...TIME_SLOTS] : [])),
  };
}

export const SCHEDULE_PRESETS: { id: string; label: string; weekdays: number[] }[] = [
  { id: "all", label: "Cả tuần", weekdays: [0, 1, 2, 3, 4, 5, 6] },
  { id: "weekdays", label: "Ngày thường", weekdays: [1, 2, 3, 4, 5] },
  { id: "weekend", label: "Cuối tuần", weekdays: [0, 6] },
  { id: "clear", label: "Xoá hết", weekdays: [] },
];

const withBlock = (s: WorkSchedule, date: string, slots: string[] | null): WorkSchedule => {
  const rest = s.busy.filter((b) => b.date !== date);
  return {
    ...s,
    busy: slots === null ? rest : [...rest, { date, slots }].sort((a, b) => a.date.localeCompare(b.date)),
  };
};

export function setBusyAllDay(s: WorkSchedule, date: string, busy: boolean): WorkSchedule {
  return withBlock(s, date, busy ? [] : null);
}

/** Flip one slot between free and busy on a specific date. */
export function toggleBusySlot(s: WorkSchedule, date: string, slot: string): WorkSchedule {
  const block = s.busy.find((b) => b.date === date);
  const working = s.weekly[weekdayOf(date)] ?? [];
  // An all-day block is "every working slot" — expand it before editing one.
  const current = !block ? [] : block.slots.length === 0 ? working : block.slots;
  const next = current.includes(slot) ? current.filter((t) => t !== slot) : sortSlots([...current, slot]);
  return withBlock(s, date, next.length === 0 ? null : next);
}

/** Server-side guard: keep only known slots, 7 weekdays, and upcoming busy dates. */
export function sanitizeSchedule(raw: Partial<WorkSchedule>, fromISO: string): WorkSchedule {
  const known = (slots: unknown) =>
    Array.isArray(slots) ? sortSlots(slots.filter((t): t is string => TIME_SLOTS.includes(t))) : [];
  return {
    weekly: Array.from({ length: 7 }, (_, i) => known(raw.weekly?.[i])),
    busy: (raw.busy ?? [])
      .filter((b) => typeof b?.date === "string" && b.date >= fromISO)
      .map((b) => ({ date: b.date, slots: known(b.slots) })),
  };
}
