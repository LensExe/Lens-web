import { Switch, cn } from "@lens/ui";
import { TIME_PERIODS } from "@/lib/booking";
import {
  SCHEDULE_PRESETS,
  WEEK_ORDER,
  WEEKDAY_NAME,
  applyPreset,
  setDayWorking,
  toggleWeeklySlot,
} from "@/lib/schedule";
import type { WorkSchedule } from "@/types";

const ROW = "sm:grid sm:grid-cols-[9.5rem_minmax(0,1fr)_4.5rem] sm:items-center sm:gap-4";

/** Mon→Sun × 6 time slots: the hours clients can book, repeated every week. */
export function WeeklyHoursEditor({
  schedule,
  onChange,
}: {
  schedule: WorkSchedule;
  onChange: (next: WorkSchedule) => void;
}) {
  const perWeek = schedule.weekly.reduce((n, day) => n + day.length, 0);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Giờ làm việc hằng tuần</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Bật những khung bạn nhận chụp — lặp lại mỗi tuần ·{" "}
            <span className="font-medium text-foreground">{perWeek} khung/tuần</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Mẫu nhanh">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(applyPreset(schedule, preset.weekdays))}
              className="focus-ring rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className={cn("hidden pb-2 text-xs font-medium text-muted-foreground", ROW)}>
          <span />
          <div className="grid grid-cols-3 gap-3">
            {TIME_PERIODS.map((p) => (
              <span key={p.id} className="text-center">
                {p.label}
              </span>
            ))}
          </div>
          <span />
        </div>

        <div className="divide-y divide-border border-t border-border">
          {WEEK_ORDER.map((weekday) => {
            const slots = schedule.weekly[weekday];
            const working = slots.length > 0;
            const count = working ? `${slots.length} khung` : "Nghỉ";
            return (
              <div key={weekday} className={cn("flex flex-col gap-2 py-3", ROW)}>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <Switch
                      checked={working}
                      onCheckedChange={(on) => onChange(setDayWorking(schedule, weekday, on))}
                      aria-label={`Nhận lịch ${WEEKDAY_NAME[weekday]}`}
                    />
                    <span className={cn(!working && "text-muted-foreground")}>
                      {WEEKDAY_NAME[weekday]}
                    </span>
                  </label>
                  <span className="text-xs text-muted-foreground sm:hidden">{count}</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {TIME_PERIODS.map((period) => (
                    <div key={period.id} className="grid grid-cols-2 gap-1.5">
                      {period.slots.map((time) => {
                        const on = slots.includes(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            aria-pressed={on}
                            aria-label={`${WEEKDAY_NAME[weekday]} ${time}`}
                            onClick={() => onChange(toggleWeeklySlot(schedule, weekday, time))}
                            className={cn(
                              "focus-ring h-9 rounded-xl border text-xs font-medium tabular-nums transition-colors",
                              on
                                ? "border-lagoon/30 bg-lagoon/10 font-semibold text-lagoon hover:bg-lagoon/15 dark:border-lagoon/40 dark:bg-lagoon/15 dark:hover:bg-lagoon/20"
                                : "border-dashed border-border text-muted-foreground/70 hover:border-foreground/30 hover:text-foreground"
                            )}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <span className="hidden text-right text-xs text-muted-foreground sm:block">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
