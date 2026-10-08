import { Check, Clock3, Images, Send } from "lucide-react";
import { cn, formatPrice } from "@lens/ui";
import type { PhotographerPackage } from "@/types";

/** Radio cards for the photographer's packages. */
export function PackagePicker({
  packages,
  value,
  onChange,
}: {
  packages: PhotographerPackage[];
  value: string;
  onChange: (id: string) => void;
}) {
  const popular = packages[0]?.id;

  return (
    <div role="radiogroup" aria-label="Gói chụp" className="grid gap-3 md:grid-cols-2">
      {packages.map((pkg) => {
        const active = value === pkg.id;
        return (
          <button
            key={pkg.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(pkg.id)}
            className={cn(
              "focus-ring relative flex min-h-[244px] flex-col rounded-xl border p-4 text-left transition-all sm:p-5",
              active
                ? "border-slate-800 bg-white ring-1 ring-slate-800"
                : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm"
            )}
          >
            {pkg.id === popular && (
              <span className="absolute left-4 top-4 rounded-md bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-600">
                Phổ biến nhất
              </span>
            )}
            <span
              className={cn(
                "absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border",
                active ? "border-slate-800 bg-slate-800 text-white" : "border-slate-300 bg-white"
              )}
            >
              {active && <Check className="size-3" />}
            </span>
            <p className="mt-8 pr-7 font-semibold leading-5">{pkg.name}</p>
            {pkg.description && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{pkg.description}</p>
            )}
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <Images className="size-3.5 text-slate-400" />
                <span className="font-semibold">{pkg.photoCount} ảnh</span> bàn giao hoàn thiện màu
              </li>
              <li className="flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-slate-400" />
                <span className="font-semibold">{String(pkg.durationHours).replace(".", ",")} giờ</span> thời lượng chụp
              </li>
              <li className="flex items-center gap-1.5">
                <Send className="size-3.5 text-slate-400" />
                Thời hạn giao ảnh: {pkg.deliveryDays ? `${pkg.deliveryDays} ngày làm việc` : "chưa cấu hình"}
              </li>
            </ul>
            <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-400">Chi phí trọn gói</span>
              <p className="text-lg font-semibold tabular-nums text-slate-800">{formatPrice(pkg.price)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
