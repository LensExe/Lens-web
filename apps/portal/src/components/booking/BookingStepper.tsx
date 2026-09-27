import { Check } from "lucide-react";
import { cn } from "@lens/ui";

// The deposit happens on its own page right after "Xác nhận" — shown here so
// the client knows it's coming.
const STEPS = ["Gói & lịch", "Thông tin", "Xác nhận", "Đặt cọc"];

export function BookingStepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
      {STEPS.map((label, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                done || current ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                current ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-border sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
