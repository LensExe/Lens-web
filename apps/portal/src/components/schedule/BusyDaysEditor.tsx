import { useState } from "react";
import { X } from "lucide-react";
import { Calendar } from "@lens/ui";
import { DaySlotsPanel } from "@/components/schedule/DaySlotsPanel";
import {
  countSlots,
  dayLabel,
  fromISODate,
  setBusyAllDay,
  toISODate,
  toggleBusySlot,
} from "@/lib/schedule";
import type { Booking, DayAvailability, WorkSchedule } from "@/types";

type DayKind = "free" | "partial" | "busy" | "booked";

// One colour per day, most important first: a client booking > fully busy >
// partly busy > open. Days off stay plain.
const kindOf = (day: DayAvailability): DayKind | null => {
  if (countSlots(day, "booked")) return "booked";
  const busy = countSlots(day, "busy");
  const free = countSlots(day, "free");
  if (busy && !free) return "busy";
  if (busy) return "partial";
  return free ? "free" : null;
};

const KIND: Record<DayKind, { label: string; dot: string; cell: string }> = {
  free: {
    label: "Nhận lịch",
    dot: "bg-foreground",
    cell: "[&_button]:text-foreground",
  },
  partial: {
    label: "Bận một phần",
    dot: "bg-amber-500",
    cell: "[&_button]:bg-amber-100 [&_button]:text-amber-800 dark:[&_button]:bg-amber-500/20 dark:[&_button]:text-amber-300",
  },
  busy: {
    label: "Bận cả ngày",
    dot: "bg-muted-foreground/60",
    cell: "[&_button]:bg-muted [&_button]:text-muted-foreground [&_button]:line-through",
  },
  booked: {
    label: "Có khách đặt",
    dot: "bg-sky-500",
    cell: "[&_button]:bg-sky-100 [&_button]:text-sky-800 dark:[&_button]:bg-sky-500/20 dark:[&_button]:text-sky-300",
  },
};
const KINDS = Object.keys(KIND) as DayKind[];

/** Month calendar of the booking window + the picked day's slots + busy list. */
export function BusyDaysEditor({
  schedule,
  onChange,
  days,
  bookingsByDate,
}: {
  schedule: WorkSchedule;
  onChange: (next: WorkSchedule) => void;
  days: DayAvailability[];
  bookingsByDate: Record<string, Booking[]>;
}) {
  // Open on the first day that has any slot (a day off is a dull default).
  const [selected, setSelected] = useState(
    () => (days.find((d) => d.slots.length > 0) ?? days[0])?.date ?? ""
  );
  const inWindow = new Set(days.map((d) => d.date));
  const day = days.find((d) => d.date === selected) ?? days[0];

  const modifiers = Object.fromEntries(
    KINDS.map((k) => [k, days.filter((d) => kindOf(d) === k).map((d) => fromISODate(d.date))])
  );
  const modifiersClassNames = Object.fromEntries(
    KINDS.map((k) => [k, `[&_button]:font-semibold ${KIND[k].cell}`])
  );
  const blocks = schedule.busy.filter((b) => inWindow.has(b.date));

  return (
    <section className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <h2 className="text-base font-semibold">Ngày bận & lịch đã đặt</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Chọn một ngày để đánh dấu bận từng khung hoặc cả ngày. Khung đã có khách đặt được giữ
        nguyên.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div>
          <div className="w-fit rounded-2xl border border-border p-3">
            <Calendar
              mode="single"
              required
              className="bg-transparent [--cell-size:--spacing(10)]"
              selected={day ? fromISODate(day.date) : undefined}
              defaultMonth={days[0] ? fromISODate(days[0].date) : undefined}
              disabled={(d: Date) => !inWindow.has(toISODate(d))}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              onSelect={(d) => d && setSelected(toISODate(d))}
            />
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border px-1 pt-3 text-xs text-muted-foreground">
              {KINDS.map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${KIND[k].dot}`} /> {KIND[k].label}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/30" /> Nghỉ
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          {day && (
            <DaySlotsPanel
              day={day}
              bookings={bookingsByDate[day.date] ?? []}
              busyAllDay={schedule.busy.some((b) => b.date === day.date && b.slots.length === 0)}
              onToggleSlot={(time) => onChange(toggleBusySlot(schedule, day.date, time))}
              onBusyAllDay={(busy) => onChange(setBusyAllDay(schedule, day.date, busy))}
            />
          )}

          <div>
            <p className="text-sm font-medium">
              Đã đánh dấu bận <span className="text-muted-foreground">({blocks.length})</span>
            </p>
            {blocks.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">Chưa có ngày bận nào.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {blocks.map((b) => (
                  <span
                    key={b.date}
                    className="inline-flex items-center rounded-full border border-border bg-muted/60 text-xs font-medium"
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(b.date)}
                      className="focus-ring rounded-full py-1.5 pl-3 pr-1"
                    >
                      {dayLabel(b.date)} · {b.slots.length ? b.slots.join(", ") : "Cả ngày"}
                    </button>
                    <button
                      type="button"
                      aria-label={`Bỏ bận ${dayLabel(b.date)}`}
                      onClick={() => onChange(setBusyAllDay(schedule, b.date, false))}
                      className="focus-ring rounded-full p-1.5 pr-2 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
