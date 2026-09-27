import { CalendarDays, Moon, Sun, Sunrise } from "lucide-react";
import { Calendar, Skeleton, cn } from "@lens/ui";
import { TIME_PERIODS } from "@/lib/booking";
import { countSlots, fromISODate, toISODate } from "@/lib/schedule";
import type { DayAvailability, SlotStatus } from "@/types";

const PERIOD_ICON: Record<string, typeof Sun> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const chipLabel = (iso: string) => {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
};

const TAKEN_LABEL: Record<Exclude<SlotStatus, "free">, string> = {
  booked: "Đã đặt",
  busy: "Bận",
};

/**
 * Date + time in one place: a roomy calendar where free days stand out (and
 * nearly-full ones are flagged), next to that day's time slots grouped by part
 * of day. Before a day is picked, the slot side offers the nearest free days.
 * Everything comes from the photographer's real availability (work schedule +
 * existing bookings).
 */
export function DateTimePicker({
  days,
  loading,
  date,
  timeSlot,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: {
  days: DayAvailability[];
  loading?: boolean;
  date: string;
  timeSlot: string;
  onDateChange: (iso: string) => void;
  onTimeChange: (slot: string) => void;
  dateError?: string;
  timeError?: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookable = days.filter((d) => countSlots(d, "free") > 0);
  const bookableSet = new Set(bookable.map((d) => d.date));
  const nearlyFull = bookable.filter((d) => countSlots(d, "free") === 1).map((d) => fromISODate(d.date));
  const plenty = bookable.filter((d) => countSlots(d, "free") > 1).map((d) => fromISODate(d.date));
  const selected = date ? fromISODate(date) : undefined;
  const day = days.find((d) => d.date === date);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
        <Skeleton className="h-88 w-76 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full rounded-full" />
          <Skeleton className="h-10 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
      {/* Calendar */}
      <div>
        <div className="rounded-2xl border border-border p-3">
          <Calendar
            mode="single"
            className="bg-transparent [--cell-size:--spacing(10)]"
            selected={selected}
            defaultMonth={selected ?? (bookable[0] ? fromISODate(bookable[0].date) : today)}
            disabled={[{ before: today }, (d: Date) => !bookableSet.has(toISODate(d))]}
            modifiers={{ plenty, nearlyFull }}
            modifiersClassNames={{
              plenty:
                "[&_button]:bg-emerald-50 [&_button]:font-semibold [&_button]:text-emerald-800 dark:[&_button]:bg-emerald-500/15 dark:[&_button]:text-emerald-300",
              nearlyFull:
                "[&_button]:bg-amber-100 [&_button]:font-semibold [&_button]:text-amber-800 dark:[&_button]:bg-amber-500/20 dark:[&_button]:text-amber-300",
            }}
            onSelect={(d) => onDateChange(d ? toISODate(d) : "")}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-1 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Còn trống
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" /> Còn 1 khung
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/30" /> Không nhận
            </span>
          </div>
        </div>
        {dateError && <p className="mt-2 text-sm text-destructive">{dateError}</p>}
      </div>

      {/* Time slots */}
      <div className="min-w-0">
        {date ? (
          <>
            <p className="mb-3 text-sm font-medium">Khung giờ ngày {chipLabel(date)}</p>
            {!day || countSlots(day, "free") === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Ngày này vừa kín lịch — vui lòng chọn ngày khác.
              </p>
            ) : (
              <div className="space-y-4">
                {TIME_PERIODS.map((period) => {
                  const Icon = PERIOD_ICON[period.id];
                  const slots = day.slots.filter((s) => period.slots.includes(s.time));
                  const free = slots.filter((s) => s.status === "free").length;
                  return (
                    <div key={period.id}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Icon className="size-3.5" />
                        {period.label}
                        <span className="text-muted-foreground/70">
                          ·{" "}
                          {slots.length === 0
                            ? "không nhận lịch"
                            : free > 0
                              ? `${free} khung trống`
                              : "hết chỗ"}
                        </span>
                      </p>
                      {slots.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {slots.map(({ time, status }) => {
                            const taken = status !== "free";
                            const active = !taken && timeSlot === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={taken}
                                aria-pressed={active}
                                onClick={() => onTimeChange(time)}
                                className={cn(
                                  "focus-ring flex min-w-20 items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                                  taken
                                    ? "cursor-not-allowed border-dashed border-border bg-muted/40 text-muted-foreground/50"
                                    : active
                                      ? "border-foreground bg-foreground text-background"
                                      : "border-border hover:border-foreground/40 hover:bg-muted"
                                )}
                              >
                                <span className={cn(taken && "line-through")}>{time}</span>
                                {taken && (
                                  <span className="text-[10px] font-normal">{TAKEN_LABEL[status]}</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {timeError && <p className="mt-3 text-sm text-destructive">{timeError}</p>}
          </>
        ) : (
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" />
              Ngày trống gần nhất
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Chọn nhanh một ngày, hoặc chọn trên lịch — khung giờ sẽ hiện ở đây.
            </p>
            {bookable.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nhiếp ảnh gia chưa mở lịch trống.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bookable.slice(0, 6).map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => onDateChange(d.date)}
                    className="focus-ring rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:border-foreground/40 hover:bg-muted"
                  >
                    {chipLabel(d.date)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
