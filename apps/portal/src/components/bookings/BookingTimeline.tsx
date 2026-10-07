import { Check, XCircle } from "lucide-react";
import { cn } from "@lens/ui";
import type { BookingStatus } from "@/types";
import type { BookingStatus as BackendBookingStatus } from "@/types/bookings";
import { STEPS, resolveStep } from "@/components/bookings/booking-timeline-utils";

export function BookingTimeline({
  status,
  backendStatus,
}: {
  status: BookingStatus;
  backendStatus?: BackendBookingStatus;
}) {
  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        <XCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Buổi chụp đã huỷ</p>
          <p className="mt-0.5 text-destructive/80">
            Nếu booking có giao dịch, backend sẽ tạo yêu cầu hoàn tiền để quản trị viên xử lý.
          </p>
        </div>
      </div>
    );
  }

  const currentStep = resolveStep(status, backendStatus);
  const isCompleted = status === "released";
  // For "released" all steps are done
  const doneThrough = isCompleted ? STEPS.length : currentStep;

  return (
    <ol>
      {STEPS.map((step, index) => {
        const done = index < doneThrough;
        const active = index === currentStep && !isCompleted;
        const isLast = index === STEPS.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  done ? "bg-foreground/75" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                done
                  ? "border-foreground bg-foreground text-background"
                  : active
                    ? "border-ember bg-ember text-white ring-4 ring-ember/15"
                    : "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <div className={cn("pt-0.5", !done && !active && "opacity-50")}>
              <p className="text-[11px] font-semibold">{step.title}</p>
              <p className="text-[10px] leading-4 text-muted-foreground">{step.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
