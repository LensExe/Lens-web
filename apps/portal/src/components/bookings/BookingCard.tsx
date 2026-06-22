import { Link } from "react-router-dom";
import { CalendarDays, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, cn, formatPrice } from "@lens/ui";
import { BOOKING_STATUS_META } from "@/lib/booking";
import type { Booking } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function BookingCard({ booking }: { booking: Booking }) {
  const status = BOOKING_STATUS_META[booking.status];
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <Avatar className="size-12 shrink-0">
        <AvatarFallback>{initialsOf(booking.photographerName)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{booking.photographerName}</p>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", status.className)}>
            {status.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{booking.style}</span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDate(booking.date)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {booking.location}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-semibold">{formatPrice(booking.price)}</p>
        <Link
          to={`/photographers/${booking.photographerId}`}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Xem hồ sơ
        </Link>
      </div>
    </div>
  );
}
