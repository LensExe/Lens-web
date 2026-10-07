/** Canonical timezone for Lens bookings and photographer calendars. */
export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
export const VIETNAM_UTC_OFFSET = "+07:00";
export const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
export const HALF_HOUR_MS = 30 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface VietnamDateTimeParts {
  date: string;
  time: string;
}

/** Read a UTC/API instant as a Vietnam calendar date and clock time. */
export function vietnamDateTimeParts(value: string | number | Date): VietnamDateTimeParts | null {
  const timestamp =
    value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;

  // Vietnam has no DST and uses UTC+7 year-round, so shifting before taking
  // the ISO parts keeps this deterministic even when the browser is elsewhere.
  const shifted = new Date(timestamp + VIETNAM_OFFSET_MS).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}

/** Build an API datetime from a Vietnam local date and clock time. */
export function toVietnamIso(date: string, time: string): string {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalizedTime}${VIETNAM_UTC_OFFSET}`;
}

/** Return today's ISO date in Vietnam. */
export function todayVietnamISO(): string {
  return vietnamDateTimeParts(Date.now())?.date ?? new Date().toISOString().slice(0, 10);
}

/** Add whole calendar days without using the browser's local timezone. */
export function addVietnamDaysISO(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return date;
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

/** Return an API query window aligned to Vietnam midnight. */
export function vietnamDayRange(days: number): { from: string; to: string } {
  const from = toVietnamIso(todayVietnamISO(), "00:00");
  const end = Date.parse(from) + Math.max(0, days) * DAY_MS;
  return { from, to: new Date(end).toISOString() };
}

/** Move a UTC instant to the next 30-minute boundary in Vietnam time. */
export function nextVietnamHalfHour(timestamp: number): number {
  return (
    Math.ceil((timestamp + VIETNAM_OFFSET_MS) / HALF_HOUR_MS) * HALF_HOUR_MS - VIETNAM_OFFSET_MS
  );
}
