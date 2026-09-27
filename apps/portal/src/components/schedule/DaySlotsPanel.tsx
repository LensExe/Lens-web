import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button, TONE_CHIP, cn } from "@lens/ui";
import { WEEKDAY_NAME, countSlots, dayLabel, fromISODate } from "@/lib/schedule";
import type { Booking, DayAvailability, SlotStatus } from "@/types";

// Only a client booking gets colour; free/busy are the photographer's own choice.
const STATUS: Record<SlotStatus, { label: string; className: string }> = {
  free: { label: "Trống", className: "bg-muted text-foreground" },
  busy: { label: "Bận", className: "bg-muted text-muted-foreground line-through" },
  booked: { label: "Có khách", className: TONE_CHIP.sky },
};

/**
 * One date of the studio calendar: each slot free / busy / booked. Free and
 * busy flip with one click; booked slots are locked and link to the booking.
 */
export function DaySlotsPanel({
  day,
  bookings,
  busyAllDay,
  onToggleSlot,
  onBusyAllDay,
}: {
  day: DayAvailability;
  bookings: Booking[];
  busyAllDay: boolean;
  onToggleSlot: (time: string) => void;
  onBusyAllDay: (busy: boolean) => void;
}) {
  const hasWorking = day.slots.some((s) => s.status !== "booked");
  const free = countSlots(day, "free");
  const booked = countSlots(day, "booked");
  const summary =
    day.slots.length === 0
      ? "Ngày nghỉ"
      : [free && `${free} trống`, booked && `${booked} có khách`, countSlots(day, "busy") && `${countSlots(day, "busy")} bận`]
          .filter(Boolean)
          .join(" · ");

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{dayLabel(day.date)}</p>
          <p className="text-xs text-muted-foreground">{summary}</p>
        </div>
        {hasWorking && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => onBusyAllDay(!busyAllDay)}
          >
            {busyAllDay ? "Mở lại cả ngày" : "Bận cả ngày"}
          </Button>
        )}
      </div>

      {day.slots.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          Bạn nghỉ {WEEKDAY_NAME[fromISODate(day.date).getDay()]} theo lịch hằng tuần. Muốn
          nhận khách ngày này, hãy bật khung giờ ở phần "Giờ làm việc hằng tuần".
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {day.slots.map(({ time, status }) => {
            const booking = status === "booked" ? bookings.find((b) => b.timeSlot === time) : undefined;
            return (
              <li key={time} className="flex min-h-12 items-center gap-3 py-1.5">
                <span className="w-12 text-sm font-medium tabular-nums">{time}</span>
                <span
                  className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS[status].className)}
                >
                  {STATUS[status].label}
                </span>
                {status === "booked" ? (
                  booking && (
                    <Link
                      to={`/dashboard/bookings/${booking.id}`}
                      className="ml-auto flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Lock className="size-3.5 shrink-0" />
                      <span className="truncate">{booking.clientName}</span>
                    </Link>
                  )
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto rounded-full text-muted-foreground hover:text-foreground"
                    onClick={() => onToggleSlot(time)}
                  >
                    {status === "busy" ? "Mở lại" : "Đánh dấu bận"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
