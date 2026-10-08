import { Check } from "lucide-react";
import { cn } from "@lens/ui";

// The deposit happens on its own page right after "Xác nhận" — shown here so
// the client knows it's coming.
const STEPS = ["Gói & lịch", "Địa điểm", "Gửi yêu cầu"];

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
                "flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                done || current
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs",
                current ? "font-semibold text-slate-800" : "text-slate-400"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-8 bg-slate-200 sm:w-12" />}
          </li>
        );
      })}
    </ol>
  );
}
