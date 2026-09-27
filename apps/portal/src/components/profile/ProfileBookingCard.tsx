import { CalendarDays, Package } from "lucide-react";
import { BookButton } from "@/components/profile/BookButton";
import { MessageButton } from "@/components/profile/MessageButton";
import { packageSummary, resolvePackages } from "@/lib/booking";
import { dayLabel } from "@/lib/schedule";
import type { Photographer } from "@/types";

const number = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

/**
 * The profile's booking card: the starting price (big figure, small ₫), what
 * that price buys (the cheapest package), the next free day, then the actions.
 * Which buttons appear depends on who is looking (see BookButton/MessageButton).
 */
export function ProfileBookingCard({ photographer }: { photographer: Photographer }) {
  const cheapest = [...resolvePackages(photographer)].sort((a, b) => a.price - b.price)[0];
  const priceFrom = cheapest?.price ?? photographer.pricePerSession;
  const nextFree = photographer.availableDates[0];

  return (
    <aside className="rounded-3xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">Giá từ</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{number(priceFrom)}</span>
        <span className="text-lg font-semibold">₫</span>
        <span className="ml-1 text-sm text-muted-foreground">/ buổi</span>
      </p>

      <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
        {cheapest && (
          <div className="flex gap-2.5">
            <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <dt className="font-medium">{cheapest.name}</dt>
              <dd className="text-muted-foreground">{packageSummary(cheapest)}</dd>
            </div>
          </div>
        )}
        <div className="flex gap-2.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="font-medium">Lịch trống gần nhất</dt>
            <dd className="text-muted-foreground">{nextFree ? dayLabel(nextFree) : "Chưa mở lịch trống"}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-2 [&>*]:w-full">
        <BookButton photographerId={photographer.id} />
        <MessageButton
          participant={{
            id: photographer.id,
            name: photographer.name,
            avatar: photographer.avatar,
            role: "photographer",
          }}
        />
      </div>
    </aside>
  );
}
