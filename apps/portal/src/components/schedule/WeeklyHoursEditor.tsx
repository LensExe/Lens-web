import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input, Switch, cn } from "@lens/ui";
import {
  SCHEDULE_PRESETS,
  WEEKDAY_NAME,
  WEEK_ORDER,
  addMinutesToTime,
  applyPreset,
  setDayWorking,
  timeToMinutes,
} from "@/lib/schedule";
import type { TimeRange, WorkSchedule } from "@/types";

const INPUT = "h-9 rounded-xl px-2.5 text-sm";

const hoursIn = (ranges: TimeRange[]) =>
  ranges.reduce((total, range) => total + (timeToMinutes(range.end) - timeToMinutes(range.start)) / 60, 0);

/** Recurring weekly windows. Date-specific busy exceptions live in the week view below. */
export function WeeklyHoursEditor({
  schedule,
  onChange,
}: {
  schedule: WorkSchedule;
  onChange: (next: WorkSchedule) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const totalHours = schedule.weekly.reduce((total, day) => total + hoursIn(day), 0);

  const updateDay = (weekday: number, ranges: TimeRange[]) =>
    onChange({
      ...schedule,
      weekly: schedule.weekly.map((day, index) => (index === weekday ? ranges : day)),
    });

  const updateRange = (weekday: number, index: number, patch: Partial<TimeRange>) => {
    const ranges = schedule.weekly[weekday] ?? [];
    updateDay(
      weekday,
      ranges.map((range, rangeIndex) => (rangeIndex === index ? { ...range, ...patch } : range))
    );
  };

  const addRange = (weekday: number) => {
    const ranges = schedule.weekly[weekday] ?? [];
    const last = ranges.at(-1);
    const start = last && last.end < "22:00" ? last.end : "08:00";
    const end = addMinutesToTime(start, 120);
    updateDay(weekday, [...ranges, { start, end: end > "23:30" ? "23:30" : end }]);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Mẫu giờ làm việc hằng tuần</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {totalHours} giờ/tuần
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Tạo một hoặc nhiều khoảng làm việc trong ngày. Khách chỉ có thể đặt vào những khung này.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5" aria-label="Mẫu nhanh">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(applyPreset(schedule, preset.weekdays))}
              className="focus-ring rounded-full border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="focus-ring inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-85"
          >
            {expanded ? "Thu gọn" : "Chỉnh sửa"}
            <ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-5 divide-y divide-border border-y border-border">
          {WEEK_ORDER.map((weekday) => {
            const ranges = schedule.weekly[weekday] ?? [];
            const working = ranges.length > 0;
            return (
              <div key={weekday} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start">
                <div className="flex items-center justify-between gap-3 lg:w-44 lg:shrink-0">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <Switch
                      checked={working}
                      onCheckedChange={(on) => onChange(setDayWorking(schedule, weekday, on))}
                      aria-label={`Nhận lịch ${WEEKDAY_NAME[weekday]}`}
                    />
                    <span className={cn(!working && "text-muted-foreground")}>{WEEKDAY_NAME[weekday]}</span>
                  </label>
                  <span className="text-xs text-muted-foreground lg:hidden">
                    {working ? `${hoursIn(ranges)} giờ` : "Nghỉ"}
                  </span>
                </div>

              {working ? (
                <div className="min-w-0 flex-1 space-y-2">
                  {ranges.map((range, index) => (
                    <div key={`${weekday}-${index}`} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        step={1800}
                        value={range.start}
                        onChange={(event) => updateRange(weekday, index, { start: event.target.value })}
                        className={INPUT}
                        aria-label={`${WEEKDAY_NAME[weekday]} bắt đầu khoảng ${index + 1}`}
                      />
                      <span className="text-sm text-muted-foreground">đến</span>
                      <Input
                        type="time"
                        step={1800}
                        value={range.end}
                        onChange={(event) => updateRange(weekday, index, { end: event.target.value })}
                        className={INPUT}
                        aria-label={`${WEEKDAY_NAME[weekday]} kết thúc khoảng ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => updateDay(weekday, ranges.filter((_, rangeIndex) => rangeIndex !== index))}
                        className="focus-ring rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                        aria-label={`Xóa khoảng ${index + 1} của ${WEEKDAY_NAME[weekday]}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRange(weekday)}
                    className="focus-ring inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Plus className="size-3.5" />
                    Thêm khoảng
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground lg:flex-1 lg:py-2">Không nhận lịch định kỳ</p>
              )}

              <span className="hidden w-16 shrink-0 pt-2 text-right text-xs text-muted-foreground lg:block">
                {working ? `${hoursIn(ranges)} giờ` : "Nghỉ"}
              </span>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Bạn vẫn có thể đánh dấu bận từng ngày hoặc từng khoảng cụ thể ở lịch tuần bên dưới.
      </p>
    </section>
  );
}
