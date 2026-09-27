import type { ReactNode } from "react";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, Separator, cn, formatPrice } from "@lens/ui";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export interface SummaryLine {
  label: string;
  value: number;
  /** "minus" shows as a discount, "muted" as info. */
  tone?: "minus" | "muted";
  hint?: string;
}

/**
 * Order summary card for the deposit / payment pages: who + when + where, the
 * money lines, the big "due now" amount and the page's CTA (children).
 */
export function CheckoutSummary({
  booking,
  lines,
  dueLabel,
  due,
  children,
}: {
  booking: Booking;
  lines: SummaryLine[];
  dueLabel: string;
  due: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarFallback>{initialsOf(booking.photographerName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{booking.photographerName}</p>
          <p className="truncate text-xs text-muted-foreground">{booking.style}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <dl className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4" />
          <span className="text-foreground">{formatDate(booking.date)}</span>
        </div>
        {booking.timeSlot && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            <span className="text-foreground">{booking.timeSlot}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-4" />
          <span className="truncate text-foreground">{booking.location}</span>
        </div>
      </dl>

      <Separator className="my-4" />

      <div className="space-y-2 text-sm">
        {lines.map((line) => (
          <div key={line.label} className="flex items-start justify-between gap-3">
            <span className="text-muted-foreground">
              {line.label}
              {line.hint && <span className="block text-xs">{line.hint}</span>}
            </span>
            <span
              className={cn(
                "shrink-0 font-medium tabular-nums",
                line.tone === "minus" && "text-emerald-600 dark:text-emerald-400",
                line.tone === "muted" && "text-muted-foreground"
              )}
            >
              {line.tone === "minus" ? "−" : ""}
              {formatPrice(line.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl bg-muted/50 p-4">
        <span className="text-sm font-medium">{dueLabel}</span>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatPrice(due)}</span>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
