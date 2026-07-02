import { Check, XCircle } from "lucide-react";
import { cn } from "@lens/ui";
import type { BookingStatus } from "@/types";

// The escrow lifecycle as an ordered stepper. "cancelled" is off-path → shown as
// a distinct banner instead of a step.
const STEPS: { status: Exclude<BookingStatus, "cancelled">; title: string; desc: string }[] = [
  { status: "pending", title: "Đã gửi yêu cầu", desc: "Chờ nhiếp ảnh gia xác nhận" },
  { status: "confirmed", title: "Đã xác nhận", desc: "Chờ khách thanh toán" },
  { status: "held", title: "Đã thanh toán", desc: "Sàn giữ tiền, chờ giao ảnh" },
  { status: "released", title: "Hoàn thành", desc: "Đã giao ảnh & giải ngân" },
];
const ORDER = STEPS.map((s) => s.status);

export function BookingTimeline({ status }: { status: BookingStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <XCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Buổi chụp đã huỷ</p>
          <p className="mt-0.5 text-destructive/80">
            Nếu bạn đã thanh toán, toàn bộ số tiền (và Lens Xu đã dùng) đã được
            hoàn lại.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER.indexOf(status);

  return (
    <ol>
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.status} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  done ? "bg-foreground" : "bg-border"
                )}
              />
            )}
            <span
              className={cn(
                "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                done
                  ? "border-foreground bg-foreground text-background"
                  : active
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <div className={cn("pt-0.5", !done && !active && "opacity-50")}>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
