import type { TimeRange, WorkSchedule } from "@/types";

// Work schedules (lịch làm việc) — imported ONLY by src/msw. `weekly` is indexed
// by Date.getDay() (0 = Chủ nhật … 6 = Thứ 7). Busy dates are anchored to
// "today" so the demo always has upcoming exceptions.

const MORNING = [{ start: "08:00", end: "12:00" }];
const AFTERNOON = [{ start: "14:00", end: "18:00" }];
const EVENING = [{ start: "18:00", end: "22:00" }];
const FULL = [{ start: "07:00", end: "24:00" }];

const isoFromToday = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Lý Gia Hân ("me", the photographer demo account): free all day by default;
// date-specific busy blocks and bookings carve unavailable windows out of it.
export const seedMySchedule: WorkSchedule = {
  weekly: [
    [...FULL], // CN
    [...FULL], // T2
    [...FULL], // T3
    [...FULL], // T4
    [...FULL], // T5
    [...FULL], // T6
    [...FULL], // T7
  ],
  busy: [
    { date: isoFromToday(5), ranges: [] },
    { date: isoFromToday(9), ranges: [{ start: "14:00", end: "16:00" }] },
  ],
};

// Roster photographers rotate through a few realistic weeks (3–4 working days),
// so the browse page's date filter still narrows the list.
const PATTERNS: TimeRange[][][] = [
  // Weekends full + Wednesday evening
  [FULL, [], [], EVENING, [], [], FULL],
  // Mon/Wed/Fri evenings + Saturday morning
  [[], EVENING, [], EVENING, [], EVENING, MORNING],
  // Tue/Thu all day + Sunday morning
  [MORNING, [], FULL, [], FULL, [], []],
  // Fri–Sun afternoons & evenings
  [[...AFTERNOON, ...EVENING], [], [], [], [], [...AFTERNOON, ...EVENING], [...AFTERNOON, ...EVENING]],
  // Mon–Wed daytime
  [[], [...MORNING, ...AFTERNOON], [...MORNING, ...AFTERNOON], [...MORNING, ...AFTERNOON], [], [], []],
];

export const rosterSchedule = (index: number): WorkSchedule => ({
  weekly: PATTERNS[index % PATTERNS.length].map((ranges) => ranges.map((range) => ({ ...range }))),
  busy: [{ date: isoFromToday(3 + (index % 6)), ranges: [] }],
});
