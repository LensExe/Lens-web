import { CalendarDays, Clock3 } from "lucide-react";
import { Calendar, Skeleton, cn } from "@lens/ui";
import {
  addMinutesToTime,
  fromISODate,
  slotsForDuration,
  toISODate,
} from "@/lib/schedule";
import type { DayAvailability, SlotStatus } from "@/types";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const chipLabel = (iso: string) => {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
};

const TAKEN_LABEL: Record<Exclude<SlotStatus, "free">, string> = {
  booked: "Đã đặt",
  busy: "Bận",
};

const canStartAt = (day: DayAvailability, start: string, durationHours: number) => {
  const required = slotsForDuration(start, durationHours);
  return (
    required.length > 0 &&
    required.length === Math.ceil((durationHours * 60) / 30) &&
    required.every((time) => day.slots.find((slot) => slot.time === time)?.status === "free")
  );
};

/** Date + flexible 30-minute start times, with package duration respected. */
export function DateTimePicker({
  days,
  loading,
  date,
  timeSlot,
  durationHours = 1,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: {
  days: DayAvailability[];
  loading?: boolean;
  date: string;
  timeSlot: string;
  durationHours?: number;
  onDateChange: (iso: string) => void;
  onTimeChange: (slot: string) => void;
  dateError?: string;
  timeError?: string;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookable = days.filter((day) => day.slots.some((slot) => canStartAt(day, slot.time, durationHours)));
  const bookableSet = new Set(bookable.map((day) => day.date));
  const selected = date ? fromISODate(date) : undefined;
  const day = days.find((item) => item.date === date);
  const selectedStarts = day?.slots.filter((slot) => canStartAt(day, slot.time, durationHours)) ?? [];

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
      <div>
        <div className="rounded-2xl border border-border p-3">
          <Calendar
            mode="single"
            className="bg-transparent [--cell-size:--spacing(10)]"
            selected={selected}
            defaultMonth={selected ?? (bookable[0] ? fromISODate(bookable[0].date) : today)}
            disabled={[{ before: today }, (d: Date) => !bookableSet.has(toISODate(d))]}
            modifiers={{ available: bookable.map((item) => fromISODate(item.date)) }}
            modifiersClassNames={{
              available:
                "[&_button]:bg-emerald-50 [&_button]:font-semibold [&_button]:text-emerald-800 dark:[&_button]:bg-emerald-500/15 dark:[&_button]:text-emerald-300",
            }}
            onSelect={(d) => onDateChange(d ? toISODate(d) : "")}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border px-1 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Có giờ trống
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/30" /> Không nhận
            </span>
          </div>
        </div>
        {dateError && <p className="mt-2 text-sm text-destructive">{dateError}</p>}
      </div>

      <div className="min-w-0">
        {date ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Chọn giờ bắt đầu · {chipLabel(date)}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />
                Gói này: {durationHours} giờ
              </span>
            </div>
            {!day || selectedStarts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Ngày này không còn đủ khoảng trống cho gói chụp đã chọn — vui lòng chọn ngày khác.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {day.slots.map(({ time, status }) => {
                    const startable = status === "free" && canStartAt(day, time, durationHours);
                    const active = startable && timeSlot === time;
                    const end = addMinutesToTime(time, durationHours * 60);
                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={!startable}
                        aria-pressed={active}
                        onClick={() => onTimeChange(time)}
                        className={cn(
                          "focus-ring flex min-h-12 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-sm transition-colors",
                          startable
                            ? active
                              ? "border-foreground bg-foreground text-background"
                              : "border-border hover:border-foreground/40 hover:bg-muted"
                            : "cursor-not-allowed border-dashed border-border bg-muted/30 text-muted-foreground/50"
                        )}
                      >
                        <span className={cn("font-semibold tabular-nums", !startable && status === "free" && "font-normal line-through")}>
                          {time} {startable && `– ${end}`}
                        </span>
                        <span className="mt-0.5 text-[11px]">
                          {startable ? "Bắt đầu" : status === "free" ? "Không đủ thời lượng" : TAKEN_LABEL[status]}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="flex items-start gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
                  <CalendarDays className="mt-0.5 size-3.5 shrink-0" />
                  Hệ thống giữ liền đủ {durationHours} giờ từ thời điểm bắt đầu, nên các lịch bị chồng sẽ tự động bị khóa.
                </p>
              </div>
            )}
            {timeError && <p className="mt-3 text-sm text-destructive">{timeError}</p>}
          </>
        ) : (
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="size-4 text-muted-foreground" />
              Chọn một ngày để xem giờ trống
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              Các giờ bắt đầu cách nhau 30 phút và tự động tính theo thời lượng gói.
            </p>
            {bookable.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nhiếp ảnh gia chưa mở lịch phù hợp.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bookable.slice(0, 6).map((item) => (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => onDateChange(item.date)}
                    className="focus-ring rounded-full border border-border px-3.5 py-2 text-sm transition-colors hover:border-foreground/40 hover:bg-muted"
                  >
                    {chipLabel(item.date)}
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
