import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Lock, Plus, X } from "lucide-react";
import { Button, Input } from "@lens/ui";
import {
  addMinutesToTime,
  countSlots,
  dayLabel,
  timeToMinutes,
} from "@/lib/schedule";
import type { Booking, DayAvailability, TimeRange } from "@/types";

const fallbackEnd = (start: string) => {
  const end = addMinutesToTime(start, 120);
  return timeToMinutes(end) > 23 * 60 + 30 ? "23:30" : end;
};

/** One date's booking status plus a range-based busy editor. */
export function DaySlotsPanel({
  day,
  bookings,
  busyRanges = [],
  busyAllDay,
  readOnly = false,
  minDate,
  maxDate,
  onSelectDate,
  onBusyAllDay,
  onBusyRange,
  onRemoveBusyRange,
}: {
  day: DayAvailability;
  bookings: Booking[];
  busyRanges?: TimeRange[];
  busyAllDay: boolean;
  readOnly?: boolean;
  minDate?: string;
  maxDate?: string;
  onSelectDate?: (date: string) => void;
  onBusyAllDay: (busy: boolean) => void;
  onBusyRange: (range: TimeRange) => void;
  onRemoveBusyRange: (index: number) => void;
}) {
  const firstFree = day.slots.find((slot) => slot.status === "free")?.time ?? "08:00";
  const [busyStart, setBusyStart] = useState(firstFree);
  const [busyEnd, setBusyEnd] = useState(fallbackEnd(firstFree));
  const [rangeError, setRangeError] = useState("");
  const hasWorking = day.slots.some((slot) => slot.status !== "booked");
  const free = countSlots(day, "free");
  const booked = countSlots(day, "booked");
  const summary =
    day.slots.length === 0
      ? "Chưa mở giờ"
      : [free && `${free} khung trống`, booked && `${booked} khung có khách`, countSlots(day, "busy") && `${countSlots(day, "busy")} khung bận`]
          .filter(Boolean)
          .join(" · ");


  const addBusyRange = () => {
    if (timeToMinutes(busyEnd) <= timeToMinutes(busyStart)) {
      setRangeError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    onBusyRange({ start: busyStart, end: busyEnd });
    setRangeError("");
  };

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{dayLabel(day.date)}</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onSelectDate && (
            <Input
              type="date"
              value={day.date}
              min={minDate}
              max={maxDate}
              onChange={(event) => onSelectDate(event.target.value)}
              className="h-8 w-[142px] rounded-full px-2.5 text-xs"
              aria-label="Chọn ngày"
            />
          )}
          {readOnly ? (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Chỉ xem
            </span>
          ) : hasWorking ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => onBusyAllDay(!busyAllDay)}
            >
              {busyAllDay ? "Mở lại cả ngày" : "Bận cả ngày"}
            </Button>
          ) : null}
        </div>
      </div>

      {day.slots.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          Ngày này hiện chưa có giờ mở để khách đặt lịch.
        </p>
      ) : (
        <>
          {!readOnly && !busyAllDay && (
            <div className="mt-4 rounded-2xl bg-muted/35 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Clock3 className="size-4 text-muted-foreground" />
                Đăng ký khoảng bận
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  type="time"
                  step={1800}
                  value={busyStart}
                  onChange={(event) => setBusyStart(event.target.value)}
                  className="h-9 w-[112px] rounded-xl px-2.5 text-sm"
                  aria-label="Bắt đầu khoảng bận"
                />
                <span className="text-sm text-muted-foreground">đến</span>
                <Input
                  type="time"
                  step={1800}
                  value={busyEnd}
                  onChange={(event) => setBusyEnd(event.target.value)}
                  className="h-9 w-[112px] rounded-xl px-2.5 text-sm"
                  aria-label="Kết thúc khoảng bận"
                />
                <Button type="button" size="sm" className="rounded-full" onClick={addBusyRange}>
                  <Plus className="size-4" />
                  Đánh dấu bận
                </Button>
              </div>
              {rangeError && <p className="mt-2 text-xs text-destructive">{rangeError}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                Có thể thêm nhiều khoảng trong cùng một ngày. Mốc giờ cách nhau 30 phút.
              </p>
            </div>
          )}

          {busyAllDay ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              Bạn đã đánh dấu bận cả ngày.
            </p>
          ) : busyRanges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {busyRanges.map((range, index) => (
                <span
                  key={`${range.start}-${range.end}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                >
                  {range.start} – {range.end}
                  {!readOnly && (
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-500/25"
                      onClick={() => onRemoveBusyRange(index)}
                      aria-label={`Bỏ khoảng bận ${range.start} đến ${range.end}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : null}

          {bookings.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-sm font-medium">Lịch đã đặt</p>
              <div className="mt-2 space-y-2">
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-sm transition-colors hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/15"
                  >
                    <Lock className="size-3.5 shrink-0 text-sky-700 dark:text-sky-300" />
                    <span className="font-medium tabular-nums">{booking.timeSlot}</span>
                    <span className="min-w-0 truncate text-muted-foreground">{booking.clientName}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">Xem</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
