import type { ReactNode } from "react";
import { CalendarDays, Clock, MapPin, Package } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Separator, cn, formatPrice } from "@lens/ui";
import { DEPOSIT_RATE, depositAmount } from "@/lib/booking";
import type { Photographer } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDateVN = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

function Item({ icon: Icon, value, empty }: { icon: typeof Clock; value?: string; empty: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn("truncate", value ? "text-foreground" : "text-muted-foreground/70")}>
        {value || empty}
      </span>
    </div>
  );
}

/**
 * Sticky booking summary: what's chosen so far, the price split into deposit
 * (paid right after confirming) + remainder, and the step's CTA (children).
 */
export function BookingSummaryCard({
  photographer,
  packageName,
  packageInfo,
  date,
  timeSlot,
  location,
  price,
  children,
}: {
  photographer: Pick<Photographer, "name" | "avatar" | "city">;
  packageName?: string;
  /** "15 ảnh · 1 giờ · giao trong 5 ngày" — the chosen package's terms. */
  packageInfo?: string;
  date: string;
  timeSlot: string;
  location: string;
  price: number;
  children: ReactNode;
}) {
  const deposit = depositAmount(price);
  const pct = Math.round(DEPOSIT_RATE * 100);

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarImage src={photographer.avatar} alt={photographer.name} />
          <AvatarFallback>{initialsOf(photographer.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{photographer.name}</p>
          <p className="truncate text-xs text-muted-foreground">{photographer.city}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="space-y-2.5">
        <div>
          <Item icon={Package} value={packageName} empty="Chưa chọn gói" />
          {packageInfo && <p className="mt-0.5 pl-6 text-xs text-muted-foreground">{packageInfo}</p>}
        </div>
        <Item icon={CalendarDays} value={date ? formatDateVN(date) : ""} empty="Chưa chọn ngày" />
        <Item icon={Clock} value={timeSlot} empty="Chưa chọn giờ" />
        <Item icon={MapPin} value={location} empty="Chưa có địa điểm" />
      </div>

      <Separator className="my-4" />

      {price > 0 ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Giá gói</span>
            <span className="font-medium tabular-nums">{formatPrice(price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Đặt cọc ({pct}%)
              <span className="block text-xs">Trả ngay sau khi xác nhận</span>
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatPrice(deposit)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Còn lại
              <span className="block text-xs">Sau khi nhiếp ảnh gia xác nhận</span>
            </span>
            <span className="font-medium tabular-nums text-muted-foreground">
              {formatPrice(price - deposit)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chọn gói chụp để xem chi phí.</p>
      )}

      <div className="mt-5">{children}</div>
    </div>
  );
}
