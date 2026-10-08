import type { ReactNode } from "react";
import { BadgeCheck, CalendarDays, Clock, MapPin, Package, ShieldCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Separator, cn, formatPrice } from "@lens/ui";
import { DEPOSIT_RATE, depositAmount } from "@/lib/booking";
import { addMinutesToTime } from "@/lib/schedule";
import type { Photographer } from "@/types";

const initialsOf = (name: string) =>
  name.split(" ").slice(-2).map((w) => w[0]).join("");
const formatDateVN = (s: string) => {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

function Item({
  icon: Icon,
  value,
  empty,
}: {
  icon: typeof Clock;
  value?: string;
  empty: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 text-xs">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon className="size-3.5" />
      </span>
      <span className={cn("min-w-0 leading-4", value ? "text-slate-700" : "text-slate-400")}>
        {value || empty}
      </span>
    </div>
  );
}

/** Sticky booking summary styled as the compact confirmation card in the reference. */
export function BookingSummaryCard({
  photographer,
  packageName,
  packageInfo,
  date,
  timeSlot,
  durationHours,
  location,
  price,
  children,
}: {
  photographer: Pick<Photographer, "name" | "avatar" | "city" | "rating" | "reviewCount">;
  packageName?: string;
  packageInfo?: string;
  date: string;
  timeSlot: string;
  durationHours?: number;
  location: string;
  price: number;
  children: ReactNode;
}) {
  const deposit = depositAmount(price);
  const pct = Math.round(DEPOSIT_RATE * 100);
  const timeLabel =
    timeSlot && durationHours ? `${timeSlot} – ${addMinutesToTime(timeSlot, durationHours * 60)}` : timeSlot;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)]">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-11 border border-slate-100">
            <AvatarImage src={photographer.avatar} alt={photographer.name} />
            <AvatarFallback>{initialsOf(photographer.name)}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold leading-tight text-slate-800">
            {photographer.name}
            <BadgeCheck className="size-3.5 shrink-0 fill-orange-500 text-white" />
          </p>
          <p className="mt-1 flex items-center gap-2 truncate text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 text-orange-500">
              <Star className="size-3 fill-current" /> {photographer.rating.toFixed(1)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="truncate">{photographer.city}</span>
          </p>
        </div>
      </div>

      <Separator className="my-4 bg-slate-100" />

      <div className="space-y-3">
        <div>
          <Item icon={Package} value={packageName} empty="Chưa chọn gói" />
          {packageInfo && <p className="mt-1 pl-7 text-[11px] text-slate-500">{packageInfo}</p>}
        </div>
        <Item icon={CalendarDays} value={date ? formatDateVN(date) : ""} empty="Chưa chọn ngày" />
        <Item icon={Clock} value={timeLabel} empty="Chưa chọn giờ" />
        <Item icon={MapPin} value={location} empty="Chưa có địa điểm" />
      </div>

      <Separator className="my-4 bg-slate-100" />

      {price > 0 ? (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">Giá gói dịch vụ</span>
            <span className="font-semibold tabular-nums text-slate-700">{formatPrice(price)}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">
              <span className="block font-semibold">Đặt cọc lịch ({pct}%)</span>
              <span className="mt-0.5 block text-[10px] text-slate-400">Thanh toán sau khi NAG nhận lịch</span>
            </span>
            <span className="font-semibold tabular-nums text-orange-500">{formatPrice(deposit)}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-slate-600">
              <span className="block font-semibold">Còn lại phải trả</span>
              <span className="mt-0.5 block text-[10px] text-slate-400">Thanh toán trước ngày chụp</span>
            </span>
            <span className="font-semibold tabular-nums text-slate-600">{formatPrice(price - deposit)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Chọn gói chụp để xem chi phí.</p>
      )}

      <div className="mt-5">{children}</div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange-500" />
        <p className="text-[10px] leading-4 text-slate-500">
          <span className="font-semibold text-slate-700">Đảm bảo an toàn bởi Lens:</span> Tiền cọc được giữ trung gian và chỉ giải ngân sau khi buổi chụp hoàn tất theo đúng cam kết.
        </p>
      </div>
    </div>
  );
}
