import type { WorkSchedule } from "@/types";

// Work schedules (lịch làm việc) — imported ONLY by src/msw. `weekly` is indexed
// by Date.getDay() (0 = Chủ nhật … 6 = Thứ 7). Busy dates are anchored to
// "today" so the demo always has upcoming exceptions.

const MORNING = ["08:00", "10:00"];
const AFTERNOON = ["14:00", "16:00"];
const EVENING = ["18:00", "20:00"];
const FULL = [...MORNING, ...AFTERNOON, ...EVENING];

const isoFromToday = (days: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Lý Gia Hân ("me", the photographer demo account): weekday afternoons and
// evenings, weekend mornings, Wednesdays off.
export const seedMySchedule: WorkSchedule = {
  weekly: [
    [...MORNING, ...AFTERNOON], // CN
    [...AFTERNOON, ...EVENING], // T2
    [...AFTERNOON], // T3
    [], // T4 — nghỉ
    [...AFTERNOON, ...EVENING], // T5
    [...FULL], // T6
    [...MORNING, ...AFTERNOON], // T7
  ],
  busy: [
    { date: isoFromToday(5), slots: [] },
    { date: isoFromToday(9), slots: ["14:00"] },
  ],
};

// Roster photographers rotate through a few realistic weeks (3–4 working days),
// so the browse page's date filter still narrows the list.
const PATTERNS: string[][][] = [
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
  weekly: PATTERNS[index % PATTERNS.length].map((slots) => [...slots]),
  busy: [{ date: isoFromToday(3 + (index % 6)), slots: [] }],
});
