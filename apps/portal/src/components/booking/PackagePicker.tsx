import { Check, Clock, Images, Send } from "lucide-react";
import { cn, formatPrice } from "@lens/ui";
import type { PhotographerPackage } from "@/types";

/** Radio cards for the photographer's packages; the middle one is the pick. */
export function PackagePicker({
  packages,
  value,
  onChange,
}: {
  packages: PhotographerPackage[];
  value: string;
  onChange: (id: string) => void;
}) {
  const popular = packages.length >= 3 ? packages[1].id : undefined;

  return (
    <div role="radiogroup" aria-label="Gói chụp" className="grid gap-3 sm:grid-cols-3">
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
              "focus-ring relative rounded-2xl border p-4 text-left transition-colors",
              active
                ? "border-foreground bg-muted/40 ring-1 ring-foreground"
                : "border-border hover:bg-muted/40"
            )}
          >
            {pkg.id === popular && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-ember px-2 py-0.5 text-[11px] font-semibold text-white">
                Phổ biến
              </span>
            )}
            <span
              className={cn(
                "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border",
                active ? "border-foreground bg-foreground text-background" : "border-border"
              )}
            >
              {active && <Check className="size-3" />}
            </span>
            <p className="pr-6 font-medium">{pkg.name}</p>
            {pkg.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{pkg.description}</p>
            )}
            <ul className="mt-3 space-y-1 text-xs">
              <li className="flex items-center gap-1.5">
                <Images className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{pkg.photoCount} ảnh</span> bàn giao
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                {String(pkg.durationHours).replace(".", ",")} giờ chụp
              </li>
              <li className="flex items-center gap-1.5">
                <Send className="size-3.5 text-muted-foreground" />
                Giao trong {pkg.deliveryDays} ngày
              </li>
            </ul>
            <p className="mt-3 text-lg font-semibold">{formatPrice(pkg.price)}</p>
          </button>
        );
      })}
    </div>
  );
}
