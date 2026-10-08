import { CalendarDays, Check, Clock3, Info } from "lucide-react";
import { Calendar, Skeleton, cn } from "@lens/ui";
import { addMinutesToTime, fromISODate, slotsForDuration, toISODate } from "@/lib/schedule";
import { todayVietnamISO } from "@/lib/vietnam-time";
import type { DayAvailability } from "@/types";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const chipLabel = (iso: string) => {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const canStartAt = (day: DayAvailability, start: string, durationHours: number) => {
  const required = slotsForDuration(start, durationHours);
  return (
    required.length > 0 &&
    required.length === Math.ceil((durationHours * 60) / 30) &&
    required.every((time) => day.slots.find((slot) => slot.time === time)?.status === "free")
  );
};

/** Calendar-first date and time picker styled after the booking reference. */
export function DateTimePicker({
  days,
  loading,
  error,
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
  error?: boolean;
  date: string;
  timeSlot: string;
  durationHours?: number;
  onDateChange: (iso: string) => void;
  onTimeChange: (slot: string) => void;
  dateError?: string;
  timeError?: string;
}) {
  const today = fromISODate(todayVietnamISO());
  const bookable = days.filter((day) =>
    day.slots.some((slot) => canStartAt(day, slot.time, durationHours))
  );
  const bookableSet = new Set(bookable.map((day) => day.date));
  const selected = date ? fromISODate(date) : undefined;
  const day = days.find((item) => item.date === date);
  const selectedStarts = day?.slots.filter((slot) => canStartAt(day, slot.time, durationHours)) ?? [];

  if (loading) {
    return (
      <div className="grid gap-5 md:grid-cols-[minmax(0,336px)_minmax(0,1fr)]">
        <Skeleton className="h-[330px] w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,336px)_minmax(0,1fr)]">
      <div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/45 p-3.5">
          <Calendar
            mode="single"
            className="w-full bg-transparent [--cell-size:--spacing(9)]"
            selected={selected}
            defaultMonth={selected ?? (bookable[0] ? fromISODate(bookable[0].date) : today)}
            disabled={[{ before: today }, (d: Date) => !bookableSet.has(toISODate(d))]}
            modifiers={{ available: bookable.map((item) => fromISODate(item.date)) }}
            modifiersClassNames={{
              available:
                "[&_button]:font-semibold [&_button]:text-slate-800 [&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:left-1/2 [&_button]:after:size-1 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-emerald-500",
            }}
            onSelect={(d) => onDateChange(d ? toISODate(d) : "")}
          />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-200 px-1 pt-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Có giờ trống
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-300" /> Kín lịch / Không nhận
            </span>
          </div>
        </div>
        {dateError && <p className="mt-2 text-sm text-destructive">{dateError}</p>}
      </div>

      <div className="min-w-0">
        {error && days.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Không tải được lịch trống của nhiếp ảnh gia. Vui lòng thử lại sau ít phút.
          </div>
        ) : date ? (
          <>
            <div className="mb-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Clock3 className="size-4 text-orange-500" />
                Giờ trống: {chipLabel(date)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Các khung giờ cách nhau 30 phút, phù hợp gói {String(durationHours).replace(".", ",")} giờ.
              </p>
            </div>

            {selectedStarts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Ngày này không còn đủ khoảng trống cho gói chụp đã chọn — vui lòng chọn ngày khác.
              </p>
            ) : (
              <div className="space-y-2.5">
                <div className="max-h-[330px] space-y-2 overflow-y-auto pr-1">
                  {selectedStarts.map(({ time }) => {
                    const active = timeSlot === time;
                    const end = addMinutesToTime(time, durationHours * 60);
                    return (
                      <button
                        key={time}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onTimeChange(time)}
                        className={cn(
                          "focus-ring flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all",
                          active
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-[0_5px_14px_-10px_rgba(249,115,22,0.8)]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/40"
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold tabular-nums">
                            {time} – {end}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            {active ? "Buổi chụp đã chọn" : "Khung giờ còn trống"}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "ml-3 inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold",
                            active ? "bg-white text-orange-600" : "bg-emerald-50 text-emerald-600"
                          )}
                        >
                          {active ? <Check className="size-3" /> : null}
                          {active ? "Đã chọn" : "Sẵn sàng"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] leading-4 text-slate-500">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Nếu cần khung giờ linh hoạt hoặc chụp cả ngày, bạn có thể thảo luận thêm tại bước tiếp theo.
                </p>
              </div>
            )}
            {timeError && <p className="mt-3 text-sm text-destructive">{timeError}</p>}
          </>
        ) : (
          <div>
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarDays className="size-4 text-orange-500" />
              Chọn một ngày để xem giờ trống
            </p>
            <p className="mb-3 text-xs text-slate-500">
              Các giờ bắt đầu cách nhau 30 phút và tự động tính theo thời lượng gói.
            </p>
            {bookable.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Nhiếp ảnh gia chưa mở lịch phù hợp.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {bookable.slice(0, 6).map((item) => (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => onDateChange(item.date)}
                    className="focus-ring rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm transition-colors hover:border-orange-300 hover:bg-orange-50"
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
